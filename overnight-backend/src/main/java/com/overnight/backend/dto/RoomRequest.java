package com.overnight.backend.dto;

import com.overnight.backend.entity.RoomStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RoomRequest(
        @NotNull(message = "Room type ID is required")
        Long roomTypeId,

        @NotBlank(message = "Room number is required")
        String roomNumber,

        int floor,

        RoomStatus status
) {}