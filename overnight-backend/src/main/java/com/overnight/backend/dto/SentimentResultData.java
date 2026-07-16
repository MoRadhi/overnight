package com.overnight.backend.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

/** One element of the Python /internal/sentiment response. */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record SentimentResultData(long reviewId, double sentimentScore, String sentimentLabel) {}