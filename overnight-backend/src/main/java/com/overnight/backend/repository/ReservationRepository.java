package com.overnight.backend.repository;

import com.overnight.backend.entity.Reservation;
import com.overnight.backend.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByHotelIdOrderByIdAsc(Long hotelId);
    List<Reservation> findByGuestIdOrderByIdAsc(Long guestId);
    List<Reservation> findByStatusOrderByIdAsc(ReservationStatus status);
    List<Reservation> findByHotelIdAndStatusOrderByIdAsc(Long hotelId, ReservationStatus status);
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