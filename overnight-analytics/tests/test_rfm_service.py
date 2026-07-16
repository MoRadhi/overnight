from datetime import date
from app.models.schemas import ReservationRecord
from app.services.rfm_service import compute_rfm


def test_recent_frequent_high_spend_is_champion():
    reservations = [
        ReservationRecord(guest_id=1, checkout_date=date(2026, 6, 20), total_price=1200),
        ReservationRecord(guest_id=1, checkout_date=date(2026, 5, 1), total_price=1500),
        ReservationRecord(guest_id=1, checkout_date=date(2026, 3, 1), total_price=1000),
        ReservationRecord(guest_id=1, checkout_date=date(2026, 1, 1), total_price=900),
        ReservationRecord(guest_id=1, checkout_date=date(2025, 9, 1), total_price=800),
    ]
    result = compute_rfm(reservations, as_of=date(2026, 6, 30))
    assert len(result) == 1
    assert result[0].segment == "Champions"


def test_old_single_low_spend_is_lost():
    reservations = [
        ReservationRecord(guest_id=2, checkout_date=date(2023, 1, 1), total_price=150),
    ]
    result = compute_rfm(reservations, as_of=date(2026, 6, 30))
    assert result[0].segment == "Lost"


def test_empty_input_returns_empty_list():
    assert compute_rfm([]) == []
