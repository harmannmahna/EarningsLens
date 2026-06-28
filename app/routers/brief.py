from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import TranscriptInput
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
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_CENTER
import io
from datetime import datetime

router = APIRouter()

@router.post("/brief")
def generate_brief(data: TranscriptInput):
    if len(data.transcript.strip()) < 100:
        raise HTTPException(status_code=400, detail="Transcript too short.")

    sentences      = split_sentences(data.transcript)
    sentiment      = analyze_sentiment(data.transcript)
    keywords       = extract_keywords(data.transcript)
    guidance_sents = extract_matching_sentences(sentences, GUIDANCE_KEYWORDS)
    risk_sents     = extract_matching_sentences(sentences, RISK_KEYWORDS)
    revenue_sents  = extract_matching_sentences(sentences, REVENUE_KEYWORDS)
    summary        = generate_summary(data.company, data.quarter or "", sentiment, guidance_sents, risk_sents)

    # ── Build PDF ──────────────────────────────────────────────────────────────
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()
    GS_BLUE = colors.HexColor("#1a3a5c")
    GS_GOLD = colors.HexColor("#b8962e")

    title_style = ParagraphStyle("Title", parent=styles["Title"],
        textColor=GS_BLUE, fontSize=18, spaceAfter=4)
    subtitle_style = ParagraphStyle("Sub", parent=styles["Normal"],
        textColor=GS_GOLD, fontSize=10, spaceAfter=12)
    section_style = ParagraphStyle("Section", parent=styles["Heading2"],
        textColor=GS_BLUE, fontSize=11, spaceBefore=14, spaceAfter=4)
    body_style = ParagraphStyle("Body", parent=styles["Normal"],
        fontSize=9, leading=14, spaceAfter=6)
    bullet_style = ParagraphStyle("Bullet", parent=styles["Normal"],
        fontSize=9, leading=13, leftIndent=12, spaceAfter=3,
        bulletIndent=4)

    sentiment_color = (
        colors.green if sentiment.label in ("Bullish", "Neutral-Positive")
        else colors.orange if sentiment.label == "Neutral"
        else colors.red
    )

    story = []

    # Header
    story.append(Paragraph("EarningsLens", title_style))
    story.append(Paragraph(
        f"Equity Research Brief — {data.company}  |  {data.quarter or 'Latest Quarter'}  |  "
        f"Generated {datetime.now().strftime('%d %b %Y')}",
        subtitle_style
    ))
    story.append(HRFlowable(width="100%", thickness=1.5, color=GS_BLUE))
    story.append(Spacer(1, 10))

    # Sentiment summary table
    story.append(Paragraph("Management Tone Scorecard", section_style))
    scorecard_data = [
        ["Metric", "Score", "Signal"],
        ["Overall Sentiment", f"{sentiment.overall_score:+.2f}", sentiment.label],
        ["Confidence Index", f"{sentiment.confidence_score:.0%}", "High" if sentiment.confidence_score > 0.5 else "Moderate"],
        ["Caution Index",    f"{sentiment.caution_score:.0%}",    "Elevated" if sentiment.caution_score > 0.4 else "Normal"],
    ]
    table = Table(scorecard_data, colWidths=[7*cm, 4*cm, 5*cm])
    table.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,0), GS_BLUE),
        ("TEXTCOLOR",    (0,0), (-1,0), colors.white),
        ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0), (-1,-1), 9),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [colors.HexColor("#f5f5f5"), colors.white]),
        ("GRID",         (0,0), (-1,-1), 0.3, colors.grey),
        ("ALIGN",        (1,0), (-1,-1), "CENTER"),
        ("TEXTCOLOR",    (2,1), (2,1), sentiment_color),
    ]))
    story.append(table)
    story.append(Spacer(1, 6))

    # Executive Summary
    story.append(Paragraph("Executive Summary", section_style))
    story.append(Paragraph(summary, body_style))

    # Guidance
    if guidance_sents:
        story.append(Paragraph("Forward Guidance — Key Statements", section_style))
        for s in guidance_sents[:4]:
            story.append(Paragraph(f"• {s}", bullet_style))

    # Risks
    if risk_sents:
        story.append(Paragraph("Risk Flags", section_style))
        for s in risk_sents[:4]:
            story.append(Paragraph(f"⚠ {s}", bullet_style))

    # Revenue / Financial Mentions
    if revenue_sents:
        story.append(Paragraph("Financial Highlights Mentioned", section_style))
        for s in revenue_sents[:4]:
            story.append(Paragraph(f"• {s}", bullet_style))

    # Top Keywords table
    top_kws = keywords[:12]
    if top_kws:
        story.append(Paragraph("Top Keywords by Frequency", section_style))
        kw_data = [["Keyword", "Category", "Count"]] + [
            [k.word, k.category.title(), str(k.count)] for k in top_kws
        ]
        kw_table = Table(kw_data, colWidths=[8*cm, 4*cm, 4*cm])
        kw_table.setStyle(TableStyle([
            ("BACKGROUND",  (0,0), (-1,0), GS_BLUE),
            ("TEXTCOLOR",   (0,0), (-1,0), colors.white),
            ("FONTNAME",    (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE",    (0,0), (-1,-1), 8),
            ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.HexColor("#f5f5f5"), colors.white]),
            ("GRID",        (0,0), (-1,-1), 0.3, colors.grey),
            ("ALIGN",       (2,0), (2,-1), "CENTER"),
        ]))
        story.append(kw_table)

    # Footer
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    story.append(Paragraph(
        "This brief was generated by EarningsLens — an NLP-powered earnings call intelligence platform. "
        "For research purposes only. Not financial advice.",
        ParagraphStyle("Footer", parent=styles["Normal"], fontSize=7,
                       textColor=colors.grey, alignment=TA_CENTER)
    ))

    doc.build(story)
    buffer.seek(0)

    filename = f"{data.company.replace(' ', '_')}_{data.quarter or 'latest'}_brief.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )