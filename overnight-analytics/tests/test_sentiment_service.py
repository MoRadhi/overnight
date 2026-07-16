from app.models.schemas import ReviewRecord
from app.services.sentiment_service import score_reviews


def test_positive_review_scores_positive():
    reviews = [ReviewRecord(review_id=1, comment="Absolutely wonderful stay, loved everything!")]
    result = score_reviews(reviews)
    assert result[0].sentiment_label == "POSITIVE"
    assert result[0].sentiment_score > 0


def test_negative_review_scores_negative():
    reviews = [ReviewRecord(review_id=2, comment="Awful, dirty room and rude staff.")]
    result = score_reviews(reviews)
    assert result[0].sentiment_label == "NEGATIVE"
    assert result[0].sentiment_score < 0
