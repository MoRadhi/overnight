package com.overnight.backend.dto;

import java.math.BigDecimal;

/** Enriched segment — Python RFM data joined with guest name/email from DB. */
public record GuestSegmentResponse(
        Long guestId,
        String firstName,
        String lastName,
        String email,
        String segment,
        int rScore,
        int fScore,
        int mScore,
        int recencyDays,
        int frequency,
        BigDecimal monetary
) {}