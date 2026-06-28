from fastapi import APIRouter
from app.models.schemas import CompareInput, CompareResult
from app.services.nlp_service import (
    analyze_sentiment,
    extract_keywords,
)

router = APIRouter()

@router.post("/compare", response_model=CompareResult)
def compare_transcripts(data: CompareInput):
    curr_sentiment = analyze_sentiment(data.current.transcript)
    prev_sentiment = analyze_sentiment(data.previous.transcript)

    curr_keywords = {k.word for k in extract_keywords(data.current.transcript) if k.category == "risk"}
    prev_keywords = {k.word for k in extract_keywords(data.previous.transcript) if k.category == "risk"}

    new_risks     = list(curr_keywords - prev_keywords)
    dropped_risks = list(prev_keywords - curr_keywords)

    sentiment_shift = round(curr_sentiment.overall_score - prev_sentiment.overall_score, 4)

    if sentiment_shift > 0.1:
        direction = "Improved"
    elif sentiment_shift < -0.1:
        direction = "Declined"
    else:
        direction = "Stable"

    conf_shift = curr_sentiment.confidence_score - prev_sentiment.confidence_score
    if conf_shift > 0.1:
        confidence_change = "Management sounds more confident this quarter"
    elif conf_shift < -0.1:
        confidence_change = "Management sounds less confident vs last quarter"
    else:
        confidence_change = "Confidence tone broadly unchanged"

    # Guidance narrative
    if new_risks and sentiment_shift < 0:
        guidance_change = f"Guidance tone weakened. New risk flags: {', '.join(new_risks[:3])}."
    elif dropped_risks and sentiment_shift > 0:
        guidance_change = f"Guidance improved. Risks no longer mentioned: {', '.join(dropped_risks[:3])}."
    else:
        guidance_change = "Guidance language largely consistent with prior quarter."

    # Analyst note — the "so what"
    if direction == "Declined" and new_risks:
        analyst_note = (
            f"Sentiment deteriorated by {abs(sentiment_shift):.2f} points QoQ. "
            f"New risk language around {', '.join(new_risks[:2])} warrants attention. "
            f"Monitor next quarter for confirmation of trend."
        )
    elif direction == "Improved":
        analyst_note = (
            f"Sentiment improved by {sentiment_shift:.2f} points QoQ. "
            f"{confidence_change}. "
            f"Positive re-rating catalyst possible if trend holds."
        )
    else:
        analyst_note = (
            f"No material shift in management tone QoQ (delta: {sentiment_shift:+.2f}). "
            f"Hold current thesis pending further data."
        )

    return CompareResult(
        company=data.current.company,
        sentiment_shift=sentiment_shift,
        sentiment_direction=direction,
        new_risk_keywords=new_risks,
        dropped_risk_keywords=dropped_risks,
        guidance_change=guidance_change,
        confidence_change=confidence_change,
        analyst_note=analyst_note
    )