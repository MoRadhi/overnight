package com.overnight.backend;

import com.overnight.backend.entity.*;
import com.overnight.backend.repository.*;
import com.overnight.backend.service.AvailabilityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Uses @DataJpaTest (H2 in-memory, no full Spring context) to test the
 * availability overlap logic end-to-end against a real database layer.
 */
@DataJpaTest
@ActiveProfiles("test")
@Import(AvailabilityService.class)
class AvailabilityServiceTest {

    @Autowired AvailabilityService availabilityService;
    @Autowired HotelRepository hotelRepo;
    @Autowired RoomTypeRepository roomTypeRepo;
    @Autowired RoomRepository roomRepo;
    @Autowired ReservationRepository reservationRepo;
    @Autowired GuestRepository guestRepo;

    Hotel hotel;
    Room room;
    Guest guest;

    @BeforeEach
    void setUp() {
        hotel = new Hotel();
        hotel.setName("Test Hotel");
        hotel.setAddress("1 Test St");
        hotel.setCity("Testville");
        hotel.setCountry("Testland");
        hotelRepo.save(hotel);

        RoomType rt = new RoomType();
        rt.setHotel(hotel);
        rt.setName("Standard");
        rt.setBasePrice(new BigDecimal("100.00"));
        rt.setCapacity(2);
        roomTypeRepo.save(rt);

        room = new Room();
        room.setRoomType(rt);
        room.setRoomNumber("101");
        room.setFloor(1);
        room.setStatus(RoomStatus.AVAILABLE);
        roomRepo.save(room);

        guest = new Guest();
        guest.setFirstName("Test");
        guest.setLastName("Guest");
        guest.setEmail("test@example.com");
        guestRepo.save(guest);
    }

    @Test
    void should_return_room_when_no_reservations_exist() {
        LocalDate checkIn  = LocalDate.of(2026, 8, 1);
        LocalDate checkOut = LocalDate.of(2026, 8, 5);
        List<Room> available = availabilityService.findAvailableRooms(hotel.getId(), checkIn, checkOut);
        assertThat(available).hasSize(1);
    }

    @Test
    void should_exclude_room_with_overlapping_reservation() {
        makeReservation(LocalDate.of(2026, 8, 3), LocalDate.of(2026, 8, 7), ReservationStatus.BOOKED);
        List<Room> available = availabilityService.findAvailableRooms(
                hotel.getId(), LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 5));
        assertThat(available).isEmpty();
    }

    @Test
    void should_include_room_when_reservation_ends_on_requested_check_in() {
        // Guest checks out Aug 1; new guest wants Aug 1 – Aug 5.
        // Standard hotel convention: checkout day = available for next guest.
        makeReservation(LocalDate.of(2026, 7, 28), LocalDate.of(2026, 8, 1), ReservationStatus.CHECKED_OUT);
        List<Room> available = availabilityService.findAvailableRooms(
                hotel.getId(), LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 5));
        assertThat(available).hasSize(1);
    }

    @Test
    void should_include_room_when_reservation_starts_on_requested_check_out() {
        // New guest wants Aug 1 – Aug 5; next reservation starts Aug 5.
        makeReservation(LocalDate.of(2026, 8, 5), LocalDate.of(2026, 8, 9), ReservationStatus.BOOKED);
        List<Room> available = availabilityService.findAvailableRooms(
                hotel.getId(), LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 5));
        assertThat(available).hasSize(1);
    }

    @Test
    void should_include_room_when_overlapping_reservation_is_cancelled() {
        makeReservation(LocalDate.of(2026, 8, 2), LocalDate.of(2026, 8, 6), ReservationStatus.CANCELLED);
        List<Room> available = availabilityService.findAvailableRooms(
                hotel.getId(), LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 5));
        assertThat(available).hasSize(1);
    }

    @Test
    void should_exclude_room_in_maintenance_even_when_no_reservations() {
        room.setStatus(RoomStatus.MAINTENANCE);
        roomRepo.save(room);
        List<Room> available = availabilityService.findAvailableRooms(
                hotel.getId(), LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 5));
        assertThat(available).isEmpty();
    }

    @Test
    void should_throw_when_check_in_is_not_before_check_out() {
        assertThatThrownBy(() -> availabilityService.findAvailableRooms(
                hotel.getId(),
                LocalDate.of(2026, 8, 5),
                LocalDate.of(2026, 8, 1)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("before check-out");
    }

    // ── Helper ──────────────────────────────────────────────────────────────

    private void makeReservation(LocalDate checkIn, LocalDate checkOut, ReservationStatus status) {
        Reservation r = new Reservation();
        r.setGuest(guest);
        r.setRoom(room);
        r.setHotel(hotel);
        r.setCheckInDate(checkIn);
        r.setCheckOutDate(checkOut);
        r.setStatus(status);
        r.setTotalPrice(new BigDecimal("400.00"));
        reservationRepo.save(r);
    }
}