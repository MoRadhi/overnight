package com.overnight.backend.dto;

public record AuthResponse(
        String token,
        String username
) {}