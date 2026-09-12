from fastapi import FastAPI

from app.routers import rfm, sentiment, forecast

app = FastAPI(
    title="overnight-analytics",
    description="Internal data science microservice for Overnight - RFM segmentation, "
                "review sentiment scoring, and occupancy forecasting. Called only by "
                "overnight-backend, never directly by the frontend.",
    version="0.1.0",
)

app.include_router(rfm.router)
app.include_router(sentiment.router)
app.include_router(forecast.router)


@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    return {"service": "overnight-analytics", "status": "ok"}
