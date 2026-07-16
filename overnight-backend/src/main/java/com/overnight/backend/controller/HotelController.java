package com.overnight.backend.controller;

import com.overnight.backend.dto.HotelRequest;
import com.overnight.backend.dto.HotelResponse;
import com.overnight.backend.service.HotelService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hotels")
public class HotelController {

    private final HotelService hotelService;

    public HotelController(HotelService hotelService) {
        this.hotelService = hotelService;
    }

    /**
     * GET /api/hotels
     * GET /api/hotels?country=Japan
     */
    @GetMapping
    public List<HotelResponse> list(@RequestParam(required = false) String country) {
        return hotelService.findAll(country);
    }

    /** GET /api/hotels/countries — distinct country list for browse-by-country UI. */
    @GetMapping("/countries")
    public List<String> countries() {
        return hotelService.findCountries();
    }

    @GetMapping("/{id}")
    public HotelResponse get(@PathVariable Long id) {
        return hotelService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HotelResponse create(@Valid @RequestBody HotelRequest request) {
        return hotelService.create(request);
    }

    @PutMapping("/{id}")
    public HotelResponse update(@PathVariable Long id,
                                @Valid @RequestBody HotelRequest request) {
        return hotelService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        hotelService.delete(id);
    }
}