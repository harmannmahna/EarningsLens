from fastapi import APIRouter, HTTPException
from app.models.schemas import TranscriptInput, SentimentResult
from app.services.nlp_service import analyze_sentiment

router = APIRouter()

@router.post("/sentiment", response_model=SentimentResult)
def get_sentiment(data: TranscriptInput):
    if len(data.transcript.strip()) < 100:
        raise HTTPException(status_code=400, detail="Transcript too short. Minimum 100 characters.")

    sentiment = analyze_sentiment(data.transcript)
    return sentiment 