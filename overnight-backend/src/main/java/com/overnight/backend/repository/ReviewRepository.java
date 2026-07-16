package com.overnight.backend.repository;

import com.overnight.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByReservationId(Long reservationId);

    @Query("""
        SELECT rv FROM Review rv
        JOIN rv.reservation res
        WHERE res.hotel.id = :hotelId
        ORDER BY rv.createdAt DESC
        """)
    List<Review> findByHotelId(@Param("hotelId") Long hotelId);
}