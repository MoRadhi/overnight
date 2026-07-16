package com.overnight.backend.dto;

import com.overnight.backend.entity.Guest;
import java.time.Instant;

public record GuestResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phone,
        Instant createdAt
) {
    public static GuestResponse from(Guest g) {
        return new GuestResponse(
                g.getId(), g.getFirstName(), g.getLastName(),
                g.getEmail(), g.getPhone(), g.getCreatedAt()
        );
    }
}