from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import analyze, sentiment, compare, brief

app = FastAPI(
    title="EarningsLens API",
    description="Earnings call intelligence platform — automates equity research workflows",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(sentiment.router, prefix="/api", tags=["Sentiment"])
app.include_router(compare.router, prefix="/api", tags=["Compare"])
app.include_router(brief.router, prefix="/api", tags=["Brief"])

@app.get("/")
def root():
    return {
        "name": "EarningsLens",
        "status": "running",
        "description": "Earnings call intelligence for equity research"
    }