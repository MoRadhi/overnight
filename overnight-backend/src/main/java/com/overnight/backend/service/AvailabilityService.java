package com.overnight.backend.service;

import com.overnight.backend.entity.Room;
import com.overnight.backend.entity.RoomStatus;
import com.overnight.backend.repository.ReservationRepository;
import com.overnight.backend.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Determines which rooms are bookable for a given hotel and date range.
 *
 * A room is available iff:
 *   1. Its status is AVAILABLE (not under maintenance), AND
 *   2. It has no non-cancelled reservation whose date range overlaps with
 *      [checkIn, checkOut).
 *
 * Overlap definition (half-open intervals, standard hotel convention):
 *   Existing [A, B) overlaps requested [C, D) when A < D && B > C.
 *   This is the same condition in ReservationRepository#findOverlapping.
 */
@Service
@Transactional(readOnly = true)
public class AvailabilityService {

    private final RoomRepository roomRepository;
    private final ReservationRepository reservationRepository;

    public AvailabilityService(RoomRepository roomRepository,
                               ReservationRepository reservationRepository) {
        this.roomRepository = roomRepository;
        this.reservationRepository = reservationRepository;
    }

    public List<Room> findAvailableRooms(Long hotelId, LocalDate checkIn, LocalDate checkOut) {
        if (!checkIn.isBefore(checkOut)) {
            throw new IllegalArgumentException(
                    "Check-in date must be before check-out date");
        }

        return roomRepository.findByHotelId(hotelId)
                .stream()
                .filter(room -> room.getStatus() == RoomStatus.AVAILABLE)
                .filter(room -> reservationRepository
                        .findOverlapping(room.getId(), checkIn, checkOut)
                        .isEmpty())
                .toList();
    }

    public boolean isRoomAvailable(Long roomId, LocalDate checkIn, LocalDate checkOut) {
        if (!checkIn.isBefore(checkOut)) {
            throw new IllegalArgumentException(
                    "Check-in date must be before check-out date");
        }
        return reservationRepository.findOverlapping(roomId, checkIn, checkOut).isEmpty();
    }
}