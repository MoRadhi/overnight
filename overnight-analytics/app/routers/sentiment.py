from fastapi import APIRouter

from app.models.schemas import SentimentRequest, SentimentResponse
from app.services.sentiment_service import score_reviews

router = APIRouter(prefix="/internal/sentiment", tags=["sentiment"])


@router.post("", response_model=SentimentResponse)
def analyze(request: SentimentRequest) -> SentimentResponse:
    results = score_reviews(request.reviews)
    return SentimentResponse(results=results)
