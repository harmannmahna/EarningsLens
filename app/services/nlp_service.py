import re
from typing import List, Tuple, Dict
from textblob import TextBlob
from app.models.schemas import SentimentResult, KeywordResult

# ── Finance-domain keyword dictionaries ──────────────────────────────────────

GUIDANCE_KEYWORDS = [
    "expect", "forecast", "anticipate", "outlook", "guidance", "project",
    "estimate", "full year", "next quarter", "going forward", "target",
    "revenue guidance", "EPS guidance", "we see", "we believe"
]

RISK_KEYWORDS = [
    "headwind", "uncertainty", "challenge", "risk", "concern", "volatile",
    "macro", "inflation", "slowdown", "pressure", "decline", "softness",
    "geopolitical", "regulatory", "competition", "margin compression",
    "supply chain", "fx impact", "currency"
]

REVENUE_KEYWORDS = [
    "revenue", "sales", "growth", "margin", "EBITDA", "EPS", "earnings",
    "profit", "income", "cash flow", "ARR", "MRR", "YoY", "QoQ",
    "basis points", "bps", "beat", "miss", "in-line"
]

CONFIDENCE_POSITIVE = [
    "confident", "strong", "robust", "record", "exceed", "outperform",
    "momentum", "accelerat", "exceptional", "outstanding", "pleased",
    "deliver", "ahead of", "above"
]

CONFIDENCE_NEGATIVE = [
    "cautious", "cautiously", "remain watchful", "mindful", "prudent",
    "monitor closely", "wait and see", "uncertain", "difficult environment",
    "challenging", "headwinds remain", "not immune"
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def split_sentences(text: str) -> List[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in sentences if len(s.strip()) > 20]


def sentence_contains(sentence: str, keywords: List[str]) -> bool:
    lower = sentence.lower()
    return any(kw.lower() in lower for kw in keywords)


def extract_matching_sentences(sentences: List[str], keywords: List[str]) -> List[str]:
    return [s for s in sentences if sentence_contains(s, keywords)][:8]


# ── Sentiment Analysis ────────────────────────────────────────────────────────

def analyze_sentiment(text: str) -> SentimentResult:
    blob = TextBlob(text)
    raw_score = blob.sentiment.polarity       # -1 to +1
    sentences  = split_sentences(text)

    # Confidence score: ratio of confident positive phrases
    conf_hits = sum(
        1 for s in sentences
        if any(kw in s.lower() for kw in CONFIDENCE_POSITIVE)
    )
    confidence_score = min(conf_hits / max(len(sentences), 1) * 5, 1.0)

    # Caution score: ratio of hedging/negative phrases
    caution_hits = sum(
        1 for s in sentences
        if any(kw in s.lower() for kw in CONFIDENCE_NEGATIVE)
    )
    caution_score = min(caution_hits / max(len(sentences), 1) * 5, 1.0)

    # Composite label
    if raw_score > 0.2 and confidence_score > 0.4:
        label = "Bullish"
    elif raw_score > 0.05:
        label = "Neutral-Positive"
    elif raw_score < -0.1 or caution_score > 0.5:
        label = "Cautious"
    elif raw_score < -0.2:
        label = "Bearish"
    else:
        label = "Neutral"

    # Top positive / negative phrases
    positive_phrases = [
        s for s in sentences
        if TextBlob(s).sentiment.polarity > 0.3
    ][:4]

    negative_phrases = [
        s for s in sentences
        if TextBlob(s).sentiment.polarity < -0.1
    ][:4]

    return SentimentResult(
        overall_score=round(raw_score, 4),
        confidence_score=round(confidence_score, 4),
        caution_score=round(caution_score, 4),
        label=label,
        top_positive_phrases=positive_phrases,
        top_negative_phrases=negative_phrases
    )


# ── Keyword Extraction ────────────────────────────────────────────────────────

def extract_keywords(text: str) -> List[KeywordResult]:
    lower = text.lower()
    results: List[KeywordResult] = []

    category_map: Dict[str, List[str]] = {
        "guidance": GUIDANCE_KEYWORDS,
        "risk":     RISK_KEYWORDS,
        "revenue":  REVENUE_KEYWORDS,
    }

    for category, keywords in category_map.items():
        for kw in keywords:
            count = lower.count(kw.lower())
            if count > 0:
                results.append(KeywordResult(
                    word=kw,
                    count=count,
                    category=category
                ))

    # Sort by frequency
    results.sort(key=lambda x: x.count, reverse=True)
    return results[:30]


# ── Summary Generator ─────────────────────────────────────────────────────────

def generate_summary(
    company: str,
    quarter: str,
    sentiment: SentimentResult,
    guidance_sentences: List[str],
    risk_sentences: List[str]
) -> str:
    tone = sentiment.label
    top_guidance = guidance_sentences[0] if guidance_sentences else "No explicit guidance provided."
    top_risk = risk_sentences[0] if risk_sentences else "No major risks highlighted."

    return (
        f"{company} ({quarter or 'latest quarter'}) management conveyed a {tone} tone. "
        f"Sentiment score: {sentiment.overall_score:+.2f}, "
        f"confidence: {sentiment.confidence_score:.0%}, "
        f"caution index: {sentiment.caution_score:.0%}. "
        f"Key guidance: \"{top_guidance}\" "
        f"Primary risk flagged: \"{top_risk}\""
    )