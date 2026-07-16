package com.overnight.backend.controller;

import com.overnight.backend.dto.RoomRequest;
import com.overnight.backend.dto.RoomResponse;
import com.overnight.backend.service.AvailabilityService;
import com.overnight.backend.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
public class RoomController {

    private final RoomService roomService;
    private final AvailabilityService availabilityService;

    public RoomController(RoomService roomService,
                          AvailabilityService availabilityService) {
        this.roomService = roomService;
        this.availabilityService = availabilityService;
    }

    @GetMapping("/room-types/{roomTypeId}/rooms")
    public List<RoomResponse> listByRoomType(@PathVariable Long roomTypeId) {
        return roomService.findByRoomType(roomTypeId);
    }

    @GetMapping("/hotels/{hotelId}/rooms")
    public List<RoomResponse> listByHotel(@PathVariable Long hotelId) {
        return roomService.findByHotel(hotelId);
    }

    /**
     * Availability search — the core booking-flow query.
     * Returns all AVAILABLE rooms for a hotel whose date range does not
     * overlap with any existing non-cancelled reservation.
     */
    @GetMapping("/rooms/availability")
    public List<RoomResponse> availability(
            @RequestParam Long hotelId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut) {
        return availabilityService
                .findAvailableRooms(hotelId, checkIn, checkOut)
                .stream()
                .map(RoomResponse::from)
                .toList();
    }

    @GetMapping("/rooms/{id}")
    public RoomResponse get(@PathVariable Long id) {
        return roomService.findById(id);
    }

    @PostMapping("/rooms")
    @ResponseStatus(HttpStatus.CREATED)
    public RoomResponse create(@Valid @RequestBody RoomRequest request) {
        return roomService.create(request);
    }

    @PutMapping("/rooms/{id}")
    public RoomResponse update(@PathVariable Long id,
                               @Valid @RequestBody RoomRequest request) {
        return roomService.update(id, request);
    }

    @DeleteMapping("/rooms/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        roomService.delete(id);
    }
}