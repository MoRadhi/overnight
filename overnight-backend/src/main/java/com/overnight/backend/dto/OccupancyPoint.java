package com.overnight.backend.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import java.time.LocalDate;

/** One day's occupancy data sent to the Python /internal/forecast endpoint. */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record OccupancyPoint(LocalDate date, int occupiedRooms, int totalRooms) {}