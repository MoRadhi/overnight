package com.overnight.backend.service;

import com.overnight.backend.dto.RoomRequest;
import com.overnight.backend.dto.RoomResponse;
import com.overnight.backend.entity.Room;
import com.overnight.backend.entity.RoomStatus;
import com.overnight.backend.entity.RoomType;
import com.overnight.backend.exception.ResourceNotFoundException;
import com.overnight.backend.repository.RoomRepository;
import com.overnight.backend.repository.RoomTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomTypeRepository roomTypeRepository;

    public RoomService(RoomRepository roomRepository,
                       RoomTypeRepository roomTypeRepository) {
        this.roomRepository = roomRepository;
        this.roomTypeRepository = roomTypeRepository;
    }

    public List<RoomResponse> findByRoomType(Long roomTypeId) {
        if (!roomTypeRepository.existsById(roomTypeId)) {
            throw new ResourceNotFoundException("RoomType", roomTypeId);
        }
        return roomRepository.findByRoomTypeIdOrderByIdAsc(roomTypeId)
                .stream()
                .map(RoomResponse::from)
                .toList();
    }

    public List<RoomResponse> findByHotel(Long hotelId) {
        return roomRepository.findByHotelId(hotelId)
                .stream()
                .map(RoomResponse::from)
                .toList();
    }

    public RoomResponse findById(Long id) {
        return roomRepository.findById(id)
                .map(RoomResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Room", id));
    }

    @Transactional
    public RoomResponse create(RoomRequest request) {
        RoomType roomType = roomTypeRepository.findById(request.roomTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("RoomType", request.roomTypeId()));
        Room room = new Room();
        applyRequest(room, request, roomType);
        return RoomResponse.from(roomRepository.save(room));
    }

    @Transactional
    public RoomResponse update(Long id, RoomRequest request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room", id));
        RoomType roomType = roomTypeRepository.findById(request.roomTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("RoomType", request.roomTypeId()));
        applyRequest(room, request, roomType);
        return RoomResponse.from(roomRepository.save(room));
    }

    @Transactional
    public void delete(Long id) {
        if (!roomRepository.existsById(id)) {
            throw new ResourceNotFoundException("Room", id);
        }
        roomRepository.deleteById(id);
    }

    private void applyRequest(Room room, RoomRequest req, RoomType roomType) {
        room.setRoomType(roomType);
        room.setRoomNumber(req.roomNumber());
        room.setFloor(req.floor());
        room.setStatus(req.status() != null ? req.status() : RoomStatus.AVAILABLE);
    }
}