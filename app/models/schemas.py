from pydantic import BaseModel
from typing import Optional, List

class TranscriptInput(BaseModel):
    transcript: str
    company: str
    ticker: Optional[str] = None
    quarter: Optional[str] = None   # e.g. "Q1 2026"
    year: Optional[int] = None

class CompareInput(BaseModel):
    current: TranscriptInput
    previous: TranscriptInput

class KeywordResult(BaseModel):
    word: str
    count: int
    category: str   # "guidance", "risk", "revenue", "positive", "negative"

class SentimentResult(BaseModel):
    overall_score: float        # -1 (very negative) to +1 (very positive)
    confidence_score: float     # how confident the CEO sounds
    caution_score: float        # how much hedging language
    label: str                  # "Bullish" | "Neutral" | "Cautious" | "Bearish"
    top_positive_phrases: List[str]
    top_negative_phrases: List[str]

class AnalysisResult(BaseModel):
    company: str
    ticker: Optional[str]
    quarter: Optional[str]
    sentiment: SentimentResult
    keywords: List[KeywordResult]
    guidance_sentences: List[str]
    risk_sentences: List[str]
    revenue_mentions: List[str]
    summary: str

class CompareResult(BaseModel):
    company: str
    sentiment_shift: float          # change in sentiment score
    sentiment_direction: str        # "Improved" | "Declined" | "Stable"
    new_risk_keywords: List[str]    # risks mentioned now but not before
    dropped_risk_keywords: List[str]
    guidance_change: str            # narrative summary of guidance shift
    confidence_change: str
    analyst_note: str               # the "so what" for a GS analyst