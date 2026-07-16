from datetime import date
from app.models.schemas import OccupancyPoint
from app.services.forecast_service import forecast_occupancy


def test_forecast_returns_requested_horizon():
    history = [
        OccupancyPoint(date=date(2026, 6, 1 + i), occupied_rooms=10 + i, total_rooms=20)
        for i in range(10)
    ]
    result = forecast_occupancy(history, horizon_days=5)
    assert len(result) == 5
    assert all(0.0 <= p.predicted_occupancy_rate <= 1.0 for p in result)


def test_empty_history_returns_empty():
    assert forecast_occupancy([], horizon_days=5) == []
