package com.overnight.backend.service;

import com.overnight.backend.dto.ReservationRequest;
import com.overnight.backend.dto.ReservationResponse;
import com.overnight.backend.entity.*;
import com.overnight.backend.exception.BadRequestException;
import com.overnight.backend.exception.ConflictException;
import com.overnight.backend.exception.ResourceNotFoundException;
import com.overnight.backend.repository.ReservationRepository;
import com.overnight.backend.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final GuestService guestService;
    private final AvailabilityService availabilityService;

    public ReservationService(ReservationRepository reservationRepository,
                              RoomRepository roomRepository,
                              GuestService guestService,
                              AvailabilityService availabilityService) {
        this.reservationRepository = reservationRepository;
        this.roomRepository = roomRepository;
        this.guestService = guestService;
        this.availabilityService = availabilityService;
    }

    public List<ReservationResponse> findAll(Optional<Long> hotelId) {
        List<Reservation> results = hotelId
                .map(reservationRepository::findByHotelId)
                .orElseGet(reservationRepository::findAll);
        return results.stream().map(ReservationResponse::from).toList();
    }

    public ReservationResponse findById(Long id) {
        return reservationRepository.findById(id)
                .map(ReservationResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", id));
    }

    public List<ReservationResponse> findByGuest(Long guestId) {
        return reservationRepository.findByGuestId(guestId)
                .stream()
                .map(ReservationResponse::from)
                .toList();
    }

    /**
     * Core booking flow:
     * 1. Validate date range
     * 2. Resolve the room and confirm it's available
     * 3. Find or create the guest
     * 4. Calculate total price (nights × base price)
     * 5. Persist and return
     */
    @Transactional
    public ReservationResponse create(ReservationRequest request) {
        if (!request.checkInDate().isBefore(request.checkOutDate())) {
            throw new BadRequestException("Check-in date must be before check-out date");
        }

        Room room = roomRepository.findById(request.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room", request.roomId()));

        if (room.getStatus() == RoomStatus.MAINTENANCE) {
            throw new BadRequestException("Room " + room.getRoomNumber() + " is currently under maintenance");
        }

        boolean available = availabilityService.isRoomAvailable(
                room.getId(), request.checkInDate(), request.checkOutDate());
        if (!available) {
            throw new ConflictException(
                    "Room " + room.getRoomNumber() + " is not available for the requested dates");
        }

        Guest guest = guestService.findOrCreate(
                request.firstName(), request.lastName(),
                request.email(), request.phone());

        long nights = ChronoUnit.DAYS.between(request.checkInDate(), request.checkOutDate());
        BigDecimal totalPrice = room.getRoomType().getBasePrice()
                .multiply(BigDecimal.valueOf(nights));

        Reservation reservation = new Reservation();
        reservation.setGuest(guest);
        reservation.setRoom(room);
        reservation.setHotel(room.getRoomType().getHotel());
        reservation.setCheckInDate(request.checkInDate());
        reservation.setCheckOutDate(request.checkOutDate());
        reservation.setTotalPrice(totalPrice);
        reservation.setStatus(ReservationStatus.BOOKED);

        return ReservationResponse.from(reservationRepository.save(reservation));
    }

    /**
     * Status transition guard.
     *
     * Allowed transitions:
     *   BOOKED       → CHECKED_IN  (guest arrives)
     *   CHECKED_IN   → CHECKED_OUT (guest departs)
     *   BOOKED       → CANCELLED   (guest/admin cancels before arrival)
     *   CHECKED_IN   → CANCELLED   (early departure edge case)
     *
     * Disallowed:
     *   CHECKED_OUT  → anything    (terminal state)
     *   CANCELLED    → anything    (terminal state)
     *   Any backward transition    (e.g. CHECKED_IN → BOOKED)
     */
    @Transactional
    public ReservationResponse updateStatus(Long id, ReservationStatus newStatus) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", id));

        ReservationStatus current = reservation.getStatus();

        if (current == ReservationStatus.CHECKED_OUT) {
            throw new BadRequestException("Cannot change status of a completed reservation");
        }
        if (current == ReservationStatus.CANCELLED) {
            throw new BadRequestException("Cannot change status of a cancelled reservation");
        }
        if (newStatus == ReservationStatus.BOOKED) {
            throw new BadRequestException("Cannot revert a reservation to BOOKED status");
        }
        if (newStatus == ReservationStatus.CHECKED_OUT && current != ReservationStatus.CHECKED_IN) {
            throw new BadRequestException("Reservation must be CHECKED_IN before it can be CHECKED_OUT");
        }
        if (newStatus == ReservationStatus.CHECKED_IN && current != ReservationStatus.BOOKED) {
            throw new BadRequestException("Only BOOKED reservations can be checked in");
        }

        reservation.setStatus(newStatus);
        return ReservationResponse.from(reservationRepository.save(reservation));
    }
}