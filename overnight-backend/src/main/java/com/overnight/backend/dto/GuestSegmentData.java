package com.overnight.backend.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

/** One element of the Python /internal/rfm response. */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record GuestSegmentData(
        long guestId,
        int recencyDays,
        int frequency,
        double monetary,
        int rScore,
        int fScore,
        int mScore,
        String segment
) {}