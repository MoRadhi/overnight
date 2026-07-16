package com.overnight.backend.dto;

/** Aggregated sentiment for one month, used in the sentiment trend chart. */
public record SentimentTrendPoint(
        String month,
        double avgScore,
        long positiveCount,
        long neutralCount,
        long negativeCount
) {}