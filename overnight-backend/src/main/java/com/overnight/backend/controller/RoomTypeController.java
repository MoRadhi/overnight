package com.overnight.backend.controller;

import com.overnight.backend.dto.RoomTypeRequest;
import com.overnight.backend.dto.RoomTypeResponse;
import com.overnight.backend.service.RoomTypeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class RoomTypeController {

    private final RoomTypeService roomTypeService;

    public RoomTypeController(RoomTypeService roomTypeService) {
        this.roomTypeService = roomTypeService;
    }

    /** List all room types for a specific hotel */
    @GetMapping("/hotels/{hotelId}/room-types")
    public List<RoomTypeResponse> listByHotel(@PathVariable Long hotelId) {
        return roomTypeService.findByHotel(hotelId);
    }

    @GetMapping("/room-types/{id}")
    public RoomTypeResponse get(@PathVariable Long id) {
        return roomTypeService.findById(id);
    }

    @PostMapping("/room-types")
    @ResponseStatus(HttpStatus.CREATED)
    public RoomTypeResponse create(@Valid @RequestBody RoomTypeRequest request) {
        return roomTypeService.create(request);
    }

    @PutMapping("/room-types/{id}")
    public RoomTypeResponse update(@PathVariable Long id,
                                   @Valid @RequestBody RoomTypeRequest request) {
        return roomTypeService.update(id, request);
    }

    @DeleteMapping("/room-types/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        roomTypeService.delete(id);
    }
}