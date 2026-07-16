package com.overnight.backend.controller;

import com.overnight.backend.dto.*;
import com.overnight.backend.service.AnalyticsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /** RFM-segmented guest list, optionally filtered to one hotel. */
    @GetMapping("/segments")
    public List<GuestSegmentResponse> segments(
            @RequestParam(required = false) Long hotelId) {
        return analyticsService.getSegments(Optional.ofNullable(hotelId));
    }

    /** Revenue trend, segment distribution, and key totals. */
    @GetMapping("/summary")
    public AnalyticsSummaryResponse summary(
            @RequestParam(required = false) Long hotelId) {
        return analyticsService.getSummary(Optional.ofNullable(hotelId));
    }

    /** 14-day occupancy forecast for a specific hotel. */
    @GetMapping("/forecast")
    public List<ForecastPoint> forecast(@RequestParam Long hotelId) {
        return analyticsService.getForecast(hotelId);
    }

    /** Monthly sentiment trend, optionally filtered to one hotel. */
    @GetMapping("/sentiment")
    public List<SentimentTrendPoint> sentiment(
            @RequestParam(required = false) Long hotelId) {
        return analyticsService.getSentimentTrend(Optional.ofNullable(hotelId));
    }
}