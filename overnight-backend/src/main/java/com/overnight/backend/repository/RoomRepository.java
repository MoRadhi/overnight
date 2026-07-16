package com.overnight.backend.repository;

import com.overnight.backend.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findByRoomTypeId(Long roomTypeId);

    @Query("SELECT r FROM Room r JOIN r.roomType rt WHERE rt.hotel.id = :hotelId")
    List<Room> findByHotelId(@Param("hotelId") Long hotelId);

    @Query("SELECT COUNT(r) FROM Room r JOIN r.roomType rt WHERE rt.hotel.id = :hotelId")
    long countRoomsByHotelId(@Param("hotelId") Long hotelId);
}