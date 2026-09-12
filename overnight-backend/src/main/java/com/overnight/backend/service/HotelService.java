package com.overnight.backend.service;

import com.overnight.backend.dto.HotelRequest;
import com.overnight.backend.dto.HotelResponse;
import com.overnight.backend.entity.Hotel;
import com.overnight.backend.exception.ResourceNotFoundException;
import com.overnight.backend.repository.HotelRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class HotelService {

    private final HotelRepository hotelRepository;

    public HotelService(HotelRepository hotelRepository) {
        this.hotelRepository = hotelRepository;
    }

    /**
     * Returns all hotels, optionally filtered by country.
     * A null or blank country value returns all hotels.
     */
    public List<HotelResponse> findAll(String country) {
        List<Hotel> hotels = (country == null || country.isBlank())
                ? hotelRepository.findAllByOrderByIdAsc()
                : hotelRepository.findByCountryOrderByNameAsc(country);
        return hotels.stream()
                .map(HotelResponse::from)
                .toList();
    }

    /** Returns the distinct countries that have at least one hotel, sorted alphabetically. */
    public List<String> findCountries() {
        return hotelRepository.findDistinctCountries();
    }

    public HotelResponse findById(Long id) {
        return hotelRepository.findById(id)
                .map(HotelResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel", id));
    }

    @Transactional
    public HotelResponse create(HotelRequest request) {
        Hotel hotel = new Hotel();
        applyRequest(hotel, request);
        return HotelResponse.from(hotelRepository.save(hotel));
    }

    @Transactional
    public HotelResponse update(Long id, HotelRequest request) {
        Hotel hotel = hotelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel", id));
        applyRequest(hotel, request);
        return HotelResponse.from(hotelRepository.save(hotel));
    }

    @Transactional
    public void delete(Long id) {
        if (!hotelRepository.existsById(id)) {
            throw new ResourceNotFoundException("Hotel", id);
        }
        hotelRepository.deleteById(id);
    }

    private void applyRequest(Hotel hotel, HotelRequest req) {
        hotel.setName(req.name());
        hotel.setAddress(req.address());
        hotel.setCity(req.city());
        hotel.setCountry(req.country());
        hotel.setDescription(req.description());
        hotel.setImageUrl(req.imageUrl());
    }
}