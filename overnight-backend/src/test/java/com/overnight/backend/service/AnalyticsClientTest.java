package com.overnight.backend.service;

import com.overnight.backend.dto.OccupancyPoint;
import com.overnight.backend.dto.RfmRecord;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class AnalyticsClientTest {

    @Test
    void jacksonCanSerializeRfmPayloadToSnakeCaseJson() throws JsonProcessingException {
        RestClient restClient = RestClient.builder().baseUrl("http://localhost").build();
        AnalyticsClient analyticsClient = new AnalyticsClient(restClient);

        Map<String, Object> payload = Map.of(
                "reservations", List.of(new RfmRecord(42L, LocalDate.of(2026, 6, 20), 125.5))
        );

        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();

        String json = mapper.writeValueAsString(payload);

        assertDoesNotThrow(() -> analyticsClient.rfm(List.of(new RfmRecord(42L, LocalDate.of(2026, 6, 20), 125.5))));
        assert json.contains("guest_id") && json.contains("checkout_date") && json.contains("total_price");
    }

    @Test
    void jacksonCanSerializeForecastPayloadToSnakeCaseJson() throws JsonProcessingException {
        RestClient restClient = RestClient.builder().baseUrl("http://localhost").build();
        AnalyticsClient analyticsClient = new AnalyticsClient(restClient);

        Map<String, Object> payload = Map.of(
                "hotel_id", 7L,
                "history", List.of(new OccupancyPoint(LocalDate.of(2026, 6, 1), 10, 20)),
                "horizon_days", 14
        );

        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();

        String json = mapper.writeValueAsString(payload);

        assertDoesNotThrow(() -> analyticsClient.forecast(7L, List.of(new OccupancyPoint(LocalDate.of(2026, 6, 1), 10, 20))));
        assert json.contains("hotel_id") && json.contains("horizon_days") && json.contains("occupied_rooms");
    }
}
