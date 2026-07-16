package com.overnight.backend.dto;

import java.math.BigDecimal;

/** One month's revenue, used in the analytics summary chart. */
public record RevenueDataPoint(String month, BigDecimal revenue) {}