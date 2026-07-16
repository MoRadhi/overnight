"""
RFM (Recency, Frequency, Monetary) segmentation.

Uses pandas for the aggregation. With a small seed dataset (tens of guests,
not thousands), strict quintile binning isn't statistically meaningful, so
this service uses fixed rule-based thresholds that are easier to stabilize
for smaller datasets.
"""
from datetime import date
from typing import List

import pandas as pd

from app.models.schemas import ReservationRecord, GuestSegment


def _score_recency(days: int) -> int:
    if days <= 30:
        return 5
    if days <= 90:
        return 4
    if days <= 180:
        return 3
    if days <= 365:
        return 2
    return 1


def _score_frequency(stays: int) -> int:
    if stays >= 8:
        return 5
    if stays >= 5:
        return 4
    if stays >= 3:
        return 3
    if stays >= 2:
        return 2
    return 1


def _score_monetary(total: float) -> int:
    if total >= 3000:
        return 5
    if total >= 1500:
        return 4
    if total >= 700:
        return 3
    if total >= 250:
        return 2
    return 1


def _label_segment(r: int, f: int, m: int) -> str:
    if r >= 4 and f >= 4 and m >= 4:
        return "Champions"
    if f >= 4:
        return "Loyal"
    if r >= 4 and f <= 2:
        return "New" if f <= 1 else "Potential Loyalist"
    if r <= 2 and (f >= 3 or m >= 3):
        return "At Risk"
    if r <= 2 and f <= 2 and m <= 2:
        return "Lost"
    return "Potential Loyalist"


def compute_rfm(reservations: List[ReservationRecord], as_of: date | None = None) -> List[GuestSegment]:
    if not reservations:
        return []

    as_of = as_of or date.today()
    df = pd.DataFrame([r.model_dump() for r in reservations])

    grouped = df.groupby("guest_id").agg(
        last_checkout=("checkout_date", "max"),
        frequency=("checkout_date", "count"),
        monetary=("total_price", "sum"),
    ).reset_index()

    grouped["recency_days"] = grouped["last_checkout"].apply(lambda d: (as_of - d).days)

    results: List[GuestSegment] = []
    for _, row in grouped.iterrows():
        r_score = _score_recency(int(row["recency_days"]))
        f_score = _score_frequency(int(row["frequency"]))
        m_score = _score_monetary(float(row["monetary"]))
        segment = _label_segment(r_score, f_score, m_score)
        results.append(GuestSegment(
            guest_id=int(row["guest_id"]),
            recency_days=int(row["recency_days"]),
            frequency=int(row["frequency"]),
            monetary=round(float(row["monetary"]), 2),
            r_score=r_score,
            f_score=f_score,
            m_score=m_score,
            segment=segment,
        ))

    return results
