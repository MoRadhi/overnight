package com.overnight.backend.dto;

import com.overnight.backend.entity.ReservationStatus;
import jakarta.validation.constraints.NotNull;

public record StatusUpdateRequest(
        @NotNull(message = "Status is required")
        ReservationStatus status
) {}