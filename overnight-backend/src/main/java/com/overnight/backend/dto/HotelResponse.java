package com.overnight.backend.dto;

import com.overnight.backend.entity.Hotel;
import java.time.Instant;

public record HotelResponse(
        Long id,
        String name,
        String address,
        String city,
        String country,
        String description,
        String imageUrl,
    Integer roomTypeCount,
        Instant createdAt
) {
    public static HotelResponse from(Hotel h) {
        return new HotelResponse(
                h.getId(),
                h.getName(),
                h.getAddress(),
                h.getCity(),
                h.getCountry(),
                h.getDescription(),
                h.getImageUrl(),
                h.getRoomTypes() == null ? 0 : h.getRoomTypes().size(),
                h.getCreatedAt()
        );
    }
}