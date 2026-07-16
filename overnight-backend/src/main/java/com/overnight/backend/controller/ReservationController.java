package com.overnight.backend.controller;

import com.overnight.backend.dto.ReservationRequest;
import com.overnight.backend.dto.ReservationResponse;
import com.overnight.backend.dto.ReviewRequest;
import com.overnight.backend.dto.ReviewResponse;
import com.overnight.backend.dto.StatusUpdateRequest;
import com.overnight.backend.service.ReservationService;
import com.overnight.backend.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;
    private final ReviewService reviewService;

    public ReservationController(ReservationService reservationService,
                                 ReviewService reviewService) {
        this.reservationService = reservationService;
        this.reviewService = reviewService;
    }

    /** List all reservations, optionally filtered by hotel */
    @GetMapping
    public List<ReservationResponse> list(
            @RequestParam(required = false) Long hotelId) {
        return reservationService.findAll(Optional.ofNullable(hotelId));
    }

    @GetMapping("/{id}")
    public ReservationResponse get(@PathVariable Long id) {
        return reservationService.findById(id);
    }

    /** Public booking endpoint — creates guest (if new) + reservation */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationResponse create(@Valid @RequestBody ReservationRequest request) {
        return reservationService.create(request);
    }

    /** Admin: check-in / check-out / cancel */
    @PatchMapping("/{id}/status")
    public ReservationResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request) {
        return reservationService.updateStatus(id, request.status());
    }

    /** Guest: submit a review after checkout */
    @PostMapping("/{id}/review")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse submitReview(
            @PathVariable Long id,
            @Valid @RequestBody ReviewRequest request) {
        return reviewService.create(id, request);
    }
}