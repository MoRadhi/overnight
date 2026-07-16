"""
Lightweight occupancy forecasting - simple linear regression over recent
daily occupancy rate, via scikit-learn. Framed honestly as a short-horizon
trend projection, not a production demand-planning model. Falls back to a
flat moving-average projection if there isn't enough history for a
meaningful regression line.
"""
from datetime import timedelta
from typing import List

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

from app.models.schemas import OccupancyPoint, ForecastPoint

MIN_POINTS_FOR_REGRESSION = 7


def forecast_occupancy(history: List[OccupancyPoint], horizon_days: int) -> List[ForecastPoint]:
    if not history:
        return []

    df = pd.DataFrame([h.model_dump() for h in history]).sort_values("date")
    df["occupancy_rate"] = df["occupied_rooms"] / df["total_rooms"].replace(0, np.nan)
    df = df.dropna(subset=["occupancy_rate"])

    if df.empty:
        return []

    last_date = df["date"].max()
    future_dates = [last_date + timedelta(days=i) for i in range(1, horizon_days + 1)]

    if len(df) < MIN_POINTS_FOR_REGRESSION:
        # Not enough history for a trend line - project the recent average flat.
        flat_rate = float(df["occupancy_rate"].tail(min(len(df), 7)).mean())
        flat_rate = min(max(flat_rate, 0.0), 1.0)
        return [ForecastPoint(date=d, predicted_occupancy_rate=round(flat_rate, 4)) for d in future_dates]

    df["day_index"] = (df["date"] - df["date"].min()).apply(lambda d: d.days)
    X = df[["day_index"]].values
    y = df["occupancy_rate"].values

    model = LinearRegression()
    model.fit(X, y)

    last_index = int(df["day_index"].max())
    future_indices = np.array([[last_index + i] for i in range(1, horizon_days + 1)])
    predictions = model.predict(future_indices)
    predictions = np.clip(predictions, 0.0, 1.0)

    return [
        ForecastPoint(date=d, predicted_occupancy_rate=round(float(p), 4))
        for d, p in zip(future_dates, predictions)
    ]
