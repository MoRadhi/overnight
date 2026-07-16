package com.overnight.backend.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import java.time.LocalDate;

/** One forecast day, returned by Python and passed through to the frontend. */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record ForecastPoint(LocalDate date, double predictedOccupancyRate) {}