package com.overnight.backend.controller;

import com.overnight.backend.dto.GuestResponse;
import com.overnight.backend.dto.ReservationResponse;
import com.overnight.backend.service.GuestService;
import com.overnight.backend.service.ReservationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/guests")
public class GuestController {

    private final GuestService guestService;
    private final ReservationService reservationService;

    public GuestController(GuestService guestService,
                           ReservationService reservationService) {
        this.guestService = guestService;
        this.reservationService = reservationService;
    }

    @GetMapping
    public List<GuestResponse> list() {
        return guestService.findAll();
    }

    @GetMapping("/{id}")
    public GuestResponse get(@PathVariable Long id) {
        return guestService.findById(id);
    }

    @GetMapping("/{id}/reservations")
    public List<ReservationResponse> reservations(@PathVariable Long id) {
        return reservationService.findByGuest(id);
    }
}