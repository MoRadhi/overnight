package com.overnight.backend.dto;

import com.overnight.backend.entity.Review;
import com.overnight.backend.entity.SentimentLabel;
import java.time.Instant;

public record ReviewResponse(
        Long id,
        Long reservationId,
        Long guestId,
        String guestFullName,
        Long hotelId,
        String hotelName,
        int rating,
        String comment,
        Double sentimentScore,
        SentimentLabel sentimentLabel,
        Instant createdAt
) {
    public static ReviewResponse from(Review r) {
        return new ReviewResponse(
                r.getId(),
                r.getReservation().getId(),
                r.getReservation().getGuest().getId(),
                r.getReservation().getGuest().getFirstName() + " "
                        + r.getReservation().getGuest().getLastName(),
                r.getReservation().getHotel().getId(),
                r.getReservation().getHotel().getName(),
                r.getRating(),
                r.getComment(),
                r.getSentimentScore(),
                r.getSentimentLabel(),
                r.getCreatedAt()
        );
    }
}