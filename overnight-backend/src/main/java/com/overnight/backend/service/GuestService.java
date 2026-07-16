package com.overnight.backend.service;

import com.overnight.backend.dto.GuestResponse;
import com.overnight.backend.entity.Guest;
import com.overnight.backend.exception.ResourceNotFoundException;
import com.overnight.backend.repository.GuestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class GuestService {

    private final GuestRepository guestRepository;

    public GuestService(GuestRepository guestRepository) {
        this.guestRepository = guestRepository;
    }

    public List<GuestResponse> findAll() {
        return guestRepository.findAll()
                .stream()
                .map(GuestResponse::from)
                .toList();
    }

    public GuestResponse findById(Long id) {
        return guestRepository.findById(id)
                .map(GuestResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Guest", id));
    }

    /**
     * Used by the booking flow. Looks up an existing guest by email;
     * creates a new one if not found. Updates name/phone on each booking
     * so returning guests can correct their details naturally.
     */
    @Transactional
    public Guest findOrCreate(String firstName, String lastName,
                              String email, String phone) {
        return guestRepository.findByEmail(email)
                .map(existing -> {
                    existing.setFirstName(firstName);
                    existing.setLastName(lastName);
                    if (phone != null) existing.setPhone(phone);
                    return guestRepository.save(existing);
                })
                .orElseGet(() -> {
                    Guest g = new Guest();
                    g.setFirstName(firstName);
                    g.setLastName(lastName);
                    g.setEmail(email);
                    g.setPhone(phone);
                    return guestRepository.save(g);
                });
    }
}