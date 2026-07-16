package com.overnight.backend.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/** Top-level analytics summary returned to the frontend dashboard. */
public record AnalyticsSummaryResponse(
        List<RevenueDataPoint> revenueByMonth,
        Map<String, Long> segmentDistribution,
        BigDecimal totalRevenue,
        long totalCompletedStays,
        long totalUniqueGuests
) {}