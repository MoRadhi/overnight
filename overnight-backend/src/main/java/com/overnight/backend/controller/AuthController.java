package com.overnight.backend.controller;

import com.overnight.backend.dto.AuthRequest;
import com.overnight.backend.dto.AuthResponse;
import com.overnight.backend.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    /**
     * Authenticates the admin and returns a signed JWT.
     * Spring Security's AuthenticationManager handles the credential check;
     * a BadCredentialsException (→ 401) is thrown automatically on failure
     * and handled by GlobalExceptionHandler.
     */
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.username(), request.password()));

        String token = jwtService.generateToken(request.username());
        return new AuthResponse(token, request.username());
    }
}