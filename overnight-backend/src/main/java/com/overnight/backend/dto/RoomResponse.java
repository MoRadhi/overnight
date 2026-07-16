package com.overnight.backend.dto;

import com.overnight.backend.entity.Room;
import com.overnight.backend.entity.RoomStatus;
import java.math.BigDecimal;

public record RoomResponse(
        Long id,
        Long roomTypeId,
        String roomTypeName,
        Long hotelId,
        String hotelName,
        String roomNumber,
        int floor,
        RoomStatus status,
        BigDecimal basePrice,
        int capacity
) {
    public static RoomResponse from(Room r) {
        return new RoomResponse(
                r.getId(),
                r.getRoomType().getId(),
                r.getRoomType().getName(),
                r.getRoomType().getHotel().getId(),
                r.getRoomType().getHotel().getName(),
                r.getRoomNumber(),
                r.getFloor(),
                r.getStatus(),
                r.getRoomType().getBasePrice(),
                r.getRoomType().getCapacity()
        );
    }
}