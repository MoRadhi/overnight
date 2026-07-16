package com.overnight.backend.dto;

import com.overnight.backend.entity.Reservation;
import com.overnight.backend.entity.ReservationStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record ReservationResponse(
        Long id,
        Long guestId,
        String guestFirstName,
        String guestLastName,
        String guestEmail,
        Long roomId,
        String roomNumber,
        Long hotelId,
        String hotelName,
        String roomTypeName,
        LocalDate checkInDate,
        LocalDate checkOutDate,
        BigDecimal totalPrice,
        ReservationStatus status,
        Instant createdAt
) {
    public static ReservationResponse from(Reservation r) {
        return new ReservationResponse(
                r.getId(),
                r.getGuest().getId(),
                r.getGuest().getFirstName(),
                r.getGuest().getLastName(),
                r.getGuest().getEmail(),
                r.getRoom().getId(),
                r.getRoom().getRoomNumber(),
                r.getHotel().getId(),
                r.getHotel().getName(),
                r.getRoom().getRoomType().getName(),
                r.getCheckInDate(),
                r.getCheckOutDate(),
                r.getTotalPrice(),
                r.getStatus(),
                r.getCreatedAt()
        );
    }
}