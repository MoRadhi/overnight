package com.overnight.backend;

import com.overnight.backend.dto.ReservationRequest;
import com.overnight.backend.entity.*;
import com.overnight.backend.exception.BadRequestException;
import com.overnight.backend.exception.ConflictException;
import com.overnight.backend.repository.*;
import com.overnight.backend.service.AvailabilityService;
import com.overnight.backend.service.GuestService;
import com.overnight.backend.service.ReservationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@ActiveProfiles("test")
@Import({ReservationService.class, GuestService.class, AvailabilityService.class})
class ReservationServiceTest {

    @Autowired ReservationService reservationService;
    @Autowired ReservationRepository reservationRepository;
    @Autowired RoomRepository roomRepository;
    @Autowired RoomTypeRepository roomTypeRepository;
    @Autowired HotelRepository hotelRepository;
    @Autowired GuestRepository guestRepository;

    Hotel hotel;
    Room room;

    @BeforeEach
    void setUp() {
        hotel = new Hotel();
        hotel.setName("Test Hotel");
        hotel.setAddress("1 Test St");
        hotel.setCity("Testville");
        hotel.setCountry("Testland");
        hotelRepository.save(hotel);

        RoomType rt = new RoomType();
        rt.setHotel(hotel);
        rt.setName("Standard");
        rt.setBasePrice(new BigDecimal("100.00"));
        rt.setCapacity(2);
        roomTypeRepository.save(rt);

        room = new Room();
        room.setRoomType(rt);
        room.setRoomNumber("101");
        room.setFloor(1);
        room.setStatus(RoomStatus.AVAILABLE);
        roomRepository.save(room);
    }

    // ── Booking creation ─────────────────────────────────────────────────────

    @Test
    void should_create_reservation_and_calculate_price() {
        var response = reservationService.create(bookingRequest(
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 4)));

        assertThat(response.status()).isEqualTo(ReservationStatus.BOOKED);
        // 3 nights × £100
        assertThat(response.totalPrice()).isEqualByComparingTo("300.00");
        assertThat(response.guestEmail()).isEqualTo("guest@example.com");
    }

    @Test
    void should_find_existing_guest_by_email_on_second_booking() {
        reservationService.create(bookingRequest(
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 4)));

        // Second booking — same email, different dates
        reservationService.create(bookingRequest(
                LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 3)));

        // Only one guest record should exist
        assertThat(guestRepository.count()).isEqualTo(1);
    }

    @Test
    void should_reject_booking_when_room_is_already_reserved() {
        reservationService.create(bookingRequest(
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 5)));

        // Overlapping dates
        assertThatThrownBy(() -> reservationService.create(bookingRequest(
                LocalDate.of(2026, 9, 3), LocalDate.of(2026, 9, 7))))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("not available");
    }

    @Test
    void should_reject_booking_when_check_in_not_before_check_out() {
        assertThatThrownBy(() -> reservationService.create(bookingRequest(
                LocalDate.of(2026, 9, 5), LocalDate.of(2026, 9, 1))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("before check-out");
    }

    @Test
    void should_reject_booking_for_maintenance_room() {
        room.setStatus(RoomStatus.MAINTENANCE);
        roomRepository.save(room);

        assertThatThrownBy(() -> reservationService.create(bookingRequest(
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 4))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("maintenance");
    }

    // ── Status transitions ───────────────────────────────────────────────────

    @Test
    void should_transition_booked_to_checked_in() {
        var reservation = reservationService.create(bookingRequest(
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 4)));

        var updated = reservationService.updateStatus(
                reservation.id(), ReservationStatus.CHECKED_IN);

        assertThat(updated.status()).isEqualTo(ReservationStatus.CHECKED_IN);
    }

    @Test
    void should_transition_checked_in_to_checked_out() {
        var reservation = reservationService.create(bookingRequest(
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 4)));
        reservationService.updateStatus(reservation.id(), ReservationStatus.CHECKED_IN);

        var updated = reservationService.updateStatus(
                reservation.id(), ReservationStatus.CHECKED_OUT);

        assertThat(updated.status()).isEqualTo(ReservationStatus.CHECKED_OUT);
    }

    @Test
    void should_allow_cancellation_from_booked() {
        var reservation = reservationService.create(bookingRequest(
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 4)));

        var updated = reservationService.updateStatus(
                reservation.id(), ReservationStatus.CANCELLED);

        assertThat(updated.status()).isEqualTo(ReservationStatus.CANCELLED);
    }

    @Test
    void should_reject_checked_out_to_any_status() {
        var reservation = reservationService.create(bookingRequest(
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 4)));
        reservationService.updateStatus(reservation.id(), ReservationStatus.CHECKED_IN);
        reservationService.updateStatus(reservation.id(), ReservationStatus.CHECKED_OUT);

        assertThatThrownBy(() -> reservationService.updateStatus(
                reservation.id(), ReservationStatus.CANCELLED))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("completed");
    }

    @Test
    void should_reject_cancelled_to_any_status() {
        var reservation = reservationService.create(bookingRequest(
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 4)));
        reservationService.updateStatus(reservation.id(), ReservationStatus.CANCELLED);

        assertThatThrownBy(() -> reservationService.updateStatus(
                reservation.id(), ReservationStatus.CHECKED_IN))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("cancelled");
    }

    @Test
    void should_reject_direct_booked_to_checked_out() {
        var reservation = reservationService.create(bookingRequest(
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 4)));

        assertThatThrownBy(() -> reservationService.updateStatus(
                reservation.id(), ReservationStatus.CHECKED_OUT))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("CHECKED_IN");
    }

    @Test
    void should_allow_new_booking_after_previous_cancelled() {
        var first = reservationService.create(bookingRequest(
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 4)));
        reservationService.updateStatus(first.id(), ReservationStatus.CANCELLED);

        // Same dates, same room — should now be available again
        var second = reservationService.create(bookingRequest(
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 4)));

        assertThat(second.status()).isEqualTo(ReservationStatus.BOOKED);
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private ReservationRequest bookingRequest(LocalDate checkIn, LocalDate checkOut) {
        return new ReservationRequest(
                "Test", "Guest", "guest@example.com", "+1234567890",
                room.getId(), checkIn, checkOut);
    }
}