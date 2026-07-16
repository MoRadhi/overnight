package com.overnight.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record RoomTypeRequest(
        @NotNull(message = "Hotel ID is required")
        Long hotelId,

        @NotBlank(message = "Name is required")
        String name,

        String description,

        @NotNull
        @DecimalMin(value = "0.01", message = "Base price must be positive")
        BigDecimal basePrice,

        @Min(value = 1, message = "Capacity must be at least 1")
        int capacity,

        String imageUrl
) {}