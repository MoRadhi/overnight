package com.overnight.backend.repository;

import com.overnight.backend.entity.Guest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GuestRepository extends JpaRepository<Guest, Long> {
    Optional<Guest> findByEmail(String email);

    /** Explicit order keeps admin list positions stable across edits (Postgres does not guarantee row order otherwise). */
    List<Guest> findAllByOrderByIdAsc();
}
