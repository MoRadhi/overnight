package com.overnight.backend.dto;

import com.overnight.backend.entity.RoomType;
import java.math.BigDecimal;

public record RoomTypeResponse(
        Long id,
        Long hotelId,
        String hotelName,
        String name,
        String description,
        BigDecimal basePrice,
        int capacity,
        String imageUrl
) {
    public static RoomTypeResponse from(RoomType rt) {
        return new RoomTypeResponse(
                rt.getId(),
                rt.getHotel().getId(),
                rt.getHotel().getName(),
                rt.getName(),
                rt.getDescription(),
                rt.getBasePrice(),
                rt.getCapacity(),
                rt.getImageUrl()
        );
    }
}