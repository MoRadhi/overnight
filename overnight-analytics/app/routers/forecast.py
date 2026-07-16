from fastapi import APIRouter

from app.models.schemas import ForecastRequest, ForecastResponse
from app.services.forecast_service import forecast_occupancy

router = APIRouter(prefix="/internal/forecast", tags=["forecast"])


@router.post("", response_model=ForecastResponse)
def forecast(request: ForecastRequest) -> ForecastResponse:
    points = forecast_occupancy(request.history, request.horizon_days)
    return ForecastResponse(hotel_id=request.hotel_id, forecast=points)
