from fastapi import APIRouter, HTTPException
from app.models.schemas import TranscriptInput, AnalysisResult
from app.services.nlp_service import (
    analyze_sentiment,
    extract_keywords,
    extract_matching_sentences,
    split_sentences,
    generate_summary,
    GUIDANCE_KEYWORDS,
    RISK_KEYWORDS,
    REVENUE_KEYWORDS
)

router = APIRouter()

@router.post("/analyze", response_model=AnalysisResult)
def analyze_transcript(data: TranscriptInput):
    if len(data.transcript.strip()) < 100:
        raise HTTPException(status_code=400, detail="Transcript too short. Minimum 100 characters.")

    sentences = split_sentences(data.transcript)

    sentiment       = analyze_sentiment(data.transcript)
    keywords        = extract_keywords(data.transcript)
    guidance_sents  = extract_matching_sentences(sentences, GUIDANCE_KEYWORDS)
    risk_sents      = extract_matching_sentences(sentences, RISK_KEYWORDS)
    revenue_sents   = extract_matching_sentences(sentences, REVENUE_KEYWORDS)
    summary         = generate_summary(
                        data.company,
                        data.quarter or "",
                        sentiment,
                        guidance_sents,
                        risk_sents
                      )

    return AnalysisResult(
        company=data.company,
        ticker=data.ticker,
        quarter=data.quarter,
        sentiment=sentiment,
        keywords=keywords,
        guidance_sentences=guidance_sents,
        risk_sentences=risk_sents,
        revenue_mentions=revenue_sents,
        summary=summary
    )