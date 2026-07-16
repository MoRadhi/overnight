"""
Review sentiment scoring using VADER (Valence Aware Dictionary and sEntiment
Reasoner) - a pretrained lexicon/rule-based model well-suited to short,
informal text like guest reviews.
"""
from typing import List

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from app.models.schemas import ReviewRecord, ReviewSentiment

_analyzer = SentimentIntensityAnalyzer()


def _label_for(compound: float) -> str:
    if compound >= 0.05:
        return "POSITIVE"
    if compound <= -0.05:
        return "NEGATIVE"
    return "NEUTRAL"


def score_reviews(reviews: List[ReviewRecord]) -> List[ReviewSentiment]:
    results: List[ReviewSentiment] = []
    for review in reviews:
        scores = _analyzer.polarity_scores(review.comment)
        compound = scores["compound"]
        results.append(ReviewSentiment(
            review_id=review.review_id,
            sentiment_score=round(compound, 4),
            sentiment_label=_label_for(compound),
        ))
    return results
