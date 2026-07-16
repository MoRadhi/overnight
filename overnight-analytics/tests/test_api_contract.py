from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_rfm_endpoint_accepts_camel_case_payload():
    response = client.post(
        "/internal/rfm",
        json={
            "reservations": [
                {"guestId": 1, "checkoutDate": "2026-06-20", "totalPrice": 100.0}
            ]
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert "segments" in payload
    assert payload["segments"][0]["guest_id"] == 1


def test_forecast_endpoint_accepts_camel_case_payload():
    response = client.post(
        "/internal/forecast",
        json={
            "hotelId": 1,
            "history": [
                {"date": "2026-06-01", "occupiedRooms": 10, "totalRooms": 20}
            ],
            "horizonDays": 5,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["hotel_id"] == 1
    assert len(payload["forecast"]) == 5
