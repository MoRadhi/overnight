package com.overnight.backend.repository;

import com.overnight.backend.entity.Reservation;
import com.overnight.backend.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    /**
     * All bulk-fetch queries below join-fetch guest/room/room.roomType/hotel in one
     * round trip. Reservation's @ManyToOne associations default to EAGER, so without
     * an explicit fetch join, Hibernate issues a separate SELECT per association per
     * row - for ~200+ reservations that's 800+ queries and tens of seconds of latency
     * against a remote DB (this is what made the admin Reservations page and the
     * group-wide Analytics endpoints take 30-50s to load before this fix).
     */
    String FETCH_JOINS = """
        JOIN FETCH r.guest
        JOIN FETCH r.room rm
        JOIN FETCH rm.roomType
        JOIN FETCH r.hotel
        """;

    @Query("SELECT r FROM Reservation r " + FETCH_JOINS + " WHERE r.hotel.id = :hotelId ORDER BY r.id")
    List<Reservation> findByHotelIdOrderByIdAsc(@Param("hotelId") Long hotelId);

    @Query("SELECT r FROM Reservation r " + FETCH_JOINS + " WHERE r.guest.id = :guestId ORDER BY r.id")
    List<Reservation> findByGuestIdOrderByIdAsc(@Param("guestId") Long guestId);

    @Query("SELECT r FROM Reservation r " + FETCH_JOINS + " WHERE r.status = :status ORDER BY r.id")
    List<Reservation> findByStatusOrderByIdAsc(@Param("status") ReservationStatus status);

    @Query("SELECT r FROM Reservation r " + FETCH_JOINS + " WHERE r.hotel.id = :hotelId AND r.status = :status ORDER BY r.id")
    List<Reservation> findByHotelIdAndStatusOrderByIdAsc(@Param("hotelId") Long hotelId, @Param("status") ReservationStatus status);

    @Query("SELECT r FROM Reservation r " + FETCH_JOINS + " ORDER BY r.id")
    List<Reservation> findAllByOrderByIdAsc();

    @Query("""
        SELECT r FROM Reservation r
        WHERE r.room.id = :roomId
        AND r.status <> com.overnight.backend.entity.ReservationStatus.CANCELLED
        AND r.checkInDate < :checkOutDate
        AND r.checkOutDate > :checkInDate
        """)
    List<Reservation> findOverlapping(
            @Param("roomId") Long roomId,
            @Param("checkInDate") LocalDate checkInDate,
            @Param("checkOutDate") LocalDate checkOutDate
    );
}