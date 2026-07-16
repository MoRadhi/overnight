package com.overnight.backend.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import java.time.LocalDate;

/** Sent to the Python /internal/rfm endpoint per CHECKED_OUT reservation. */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record RfmRecord(long guestId, LocalDate checkoutDate, double totalPrice) {}