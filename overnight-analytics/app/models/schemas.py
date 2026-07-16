import re
from datetime import date
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


def _normalize_payload(value):
    if isinstance(value, dict):
        normalized = {}
        for key, item in value.items():
            normalized[re.sub(r"(?<!^)(?=[A-Z])", "_", key).lower()] = _normalize_payload(item)
        return normalized
    if isinstance(value, list):
        return [_normalize_payload(item) for item in value]
    return value


class NormalizedModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    @model_validator(mode="before")
    @classmethod
    def normalize_payload(cls, data):
        if isinstance(data, dict):
            return _normalize_payload(data)
        return data


# ---------- RFM ----------

class ReservationRecord(NormalizedModel):
    guest_id: int
    checkout_date: date
    total_price: float


class RfmRequest(NormalizedModel):
    reservations: List[ReservationRecord]
    as_of_date: Optional[date] = None  # defaults to today if omitted


class GuestSegment(NormalizedModel):
    guest_id: int
    recency_days: int
    frequency: int
    monetary: float
    r_score: int
    f_score: int
    m_score: int
    segment: str


class RfmResponse(NormalizedModel):
    segments: List[GuestSegment]


# ---------- Sentiment ----------

class ReviewRecord(NormalizedModel):
    review_id: int
    comment: str


class SentimentRequest(NormalizedModel):
    reviews: List[ReviewRecord]


class ReviewSentiment(NormalizedModel):
    review_id: int
    sentiment_score: float = Field(..., description="Compound score, -1 to 1")
    sentiment_label: str  # POSITIVE / NEUTRAL / NEGATIVE


class SentimentResponse(NormalizedModel):
    results: List[ReviewSentiment]


# ---------- Forecast ----------

class OccupancyPoint(NormalizedModel):
    date: date
    occupied_rooms: int
    total_rooms: int


class ForecastRequest(NormalizedModel):
    hotel_id: int
    history: List[OccupancyPoint]
    horizon_days: int = 14


class ForecastPoint(NormalizedModel):
    date: date
    predicted_occupancy_rate: float


class ForecastResponse(NormalizedModel):
    hotel_id: int
    forecast: List[ForecastPoint]
