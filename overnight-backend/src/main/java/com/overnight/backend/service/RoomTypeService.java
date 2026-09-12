package com.overnight.backend.service;

import com.overnight.backend.dto.RoomTypeRequest;
import com.overnight.backend.dto.RoomTypeResponse;
import com.overnight.backend.entity.Hotel;
import com.overnight.backend.entity.RoomType;
import com.overnight.backend.exception.ResourceNotFoundException;
import com.overnight.backend.repository.HotelRepository;
import com.overnight.backend.repository.RoomTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class RoomTypeService {

    private final RoomTypeRepository roomTypeRepository;
    private final HotelRepository hotelRepository;

    public RoomTypeService(RoomTypeRepository roomTypeRepository,
                           HotelRepository hotelRepository) {
        this.roomTypeRepository = roomTypeRepository;
        this.hotelRepository = hotelRepository;
    }

    public List<RoomTypeResponse> findByHotel(Long hotelId) {
        if (!hotelRepository.existsById(hotelId)) {
            throw new ResourceNotFoundException("Hotel", hotelId);
        }
        return roomTypeRepository.findByHotelIdOrderByIdAsc(hotelId)
                .stream()
                .map(RoomTypeResponse::from)
                .toList();
    }

    public RoomTypeResponse findById(Long id) {
        return roomTypeRepository.findById(id)
                .map(RoomTypeResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("RoomType", id));
    }

    @Transactional
    public RoomTypeResponse create(RoomTypeRequest request) {
        Hotel hotel = hotelRepository.findById(request.hotelId())
                .orElseThrow(() -> new ResourceNotFoundException("Hotel", request.hotelId()));
        RoomType rt = new RoomType();
        applyRequest(rt, request, hotel);
        return RoomTypeResponse.from(roomTypeRepository.save(rt));
    }

    @Transactional
    public RoomTypeResponse update(Long id, RoomTypeRequest request) {
        RoomType rt = roomTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RoomType", id));
        Hotel hotel = hotelRepository.findById(request.hotelId())
                .orElseThrow(() -> new ResourceNotFoundException("Hotel", request.hotelId()));
        applyRequest(rt, request, hotel);
        return RoomTypeResponse.from(roomTypeRepository.save(rt));
    }

    @Transactional
    public void delete(Long id) {
        if (!roomTypeRepository.existsById(id)) {
            throw new ResourceNotFoundException("RoomType", id);
        }
        roomTypeRepository.deleteById(id);
    }

    private void applyRequest(RoomType rt, RoomTypeRequest req, Hotel hotel) {
        rt.setHotel(hotel);
        rt.setName(req.name());
        rt.setDescription(req.description());
        rt.setBasePrice(req.basePrice());
        rt.setCapacity(req.capacity());
        rt.setImageUrl(req.imageUrl());
    }
}