package com.overnight.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.Instant;
import java.util.Map;

/**
 * Phase 1 wiring check only - confirms the frontend can reach the backend
 * over Axios before any real feature endpoints exist. Safe to delete once
 * real controllers are in place, or keep as a lightweight smoke-test route.
 */
@RestController
public class PingController {

    @GetMapping("/api/ping")
    public Map<String, Object> ping() {
        return Map.of(
                "service", "overnight-backend",
                "status", "ok",
                "timestamp", Instant.now().toString()
        );
    }
}
