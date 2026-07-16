package com.overnight.backend.service;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.overnight.backend.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * HTTP client for the overnight-analytics FastAPI service.
 *
 * Passes typed request objects directly to RestClient.body() so Jackson
 * (via MappingJackson2HttpMessageConverter) serialises them. Previously the
 * code pre-serialised to a String and passed that to body(), which caused
 * either StringHttpMessageConverter or Jackson to re-wrap the already-valid
 * JSON as a JSON string literal — FastAPI received a string instead of an
 * object and returned 422 "missing body".
 */
@Service
public class AnalyticsClient {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsClient.class);

    private final RestClient restClient;

    public AnalyticsClient(RestClient analyticsRestClient) {
        this.restClient = analyticsRestClient;
    }

    // ── RFM segmentation ──────────────────────────────────────────────────────

    public List<GuestSegmentData> rfm(List<RfmRecord> reservations) {
        if (reservations.isEmpty()) return List.of();
        try {
            Map<String, Object> payload = Map.of("reservations", reservations);
            RfmApiResponse response = restClient.post()
                    .uri("/internal/rfm")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(RfmApiResponse.class);
            return response != null ? response.segments() : List.of();
        } catch (Exception e) {
            log.warn("Analytics service unavailable for RFM: {}", e.getMessage());
            return List.of();
        }
    }

    // ── Sentiment scoring ─────────────────────────────────────────────────────

    public List<SentimentResultData> sentiment(List<SentimentReviewRecord> reviews) {
        if (reviews.isEmpty()) return List.of();
        try {
            SentimentApiResponse response = restClient.post()
                    .uri("/internal/sentiment")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new SentimentApiRequest(reviews))
                    .retrieve()
                    .body(SentimentApiResponse.class);
            return response != null ? response.results() : List.of();
        } catch (Exception e) {
            log.warn("Analytics service unavailable for sentiment: {}", e.getMessage());
            return List.of();
        }
    }

    // ── Occupancy forecasting ─────────────────────────────────────────────────

    public List<ForecastPoint> forecast(Long hotelId, List<OccupancyPoint> history) {
        if (history.isEmpty()) return List.of();
        try {
            Map<String, Object> payload = Map.of(
                    "hotel_id", hotelId,
                    "history", history,
                    "horizon_days", 14);
            ForecastApiResponse response = restClient.post()
                    .uri("/internal/forecast")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(ForecastApiResponse.class);
            return response != null ? response.forecast() : List.of();
        } catch (Exception e) {
            log.warn("Analytics service unavailable for forecast: {}", e.getMessage());
            return List.of();
        }
    }

    // ── Request / response wrappers ───────────────────────────────────────────

    public record SentimentReviewRecord(long reviewId, String comment) {}

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record SentimentApiRequest(List<SentimentReviewRecord> reviews) {}

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record RfmApiResponse(List<GuestSegmentData> segments) {}

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record SentimentApiResponse(List<SentimentResultData> results) {}

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record ForecastApiResponse(Long hotelId, List<ForecastPoint> forecast) {}
}