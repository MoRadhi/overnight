from fastapi import APIRouter

from app.models.schemas import RfmRequest, RfmResponse
from app.services.rfm_service import compute_rfm

router = APIRouter(prefix="/internal/rfm", tags=["rfm"])


@router.post("", response_model=RfmResponse)
def compute(request: RfmRequest) -> RfmResponse:
    segments = compute_rfm(request.reservations, request.as_of_date)
    return RfmResponse(segments=segments)
