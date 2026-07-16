package com.overnight.backend.repository;

import com.overnight.backend.entity.Reservation;
import com.overnight.backend.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByHotelId(Long hotelId);
    List<Reservation> findByGuestId(Long guestId);
    List<Reservation> findByStatus(ReservationStatus status);
    List<Reservation> findByHotelIdAndStatus(Long hotelId, ReservationStatus status);

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