package com.overnight.backend.repository;

import com.overnight.backend.entity.Hotel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface HotelRepository extends JpaRepository<Hotel, Long> {

    /** Sorted alphabetically for consistent dropdown ordering. */
    @Query("SELECT DISTINCT h.country FROM Hotel h ORDER BY h.country")
    List<String> findDistinctCountries();

    List<Hotel> findByCountryOrderByNameAsc(String country);
}