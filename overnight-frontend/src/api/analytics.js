import apiClient from "./apiClient";

const params = (hotelId) => (hotelId ? { hotelId } : {});

export const getSegments = (hotelId) =>
  apiClient
    .get("/api/analytics/segments", { params: params(hotelId) })
    .then((r) => r.data);
export const getSummary = (hotelId) =>
  apiClient
    .get("/api/analytics/summary", { params: params(hotelId) })
    .then((r) => r.data);
export const getForecast = (hotelId) =>
  apiClient
    .get("/api/analytics/forecast", { params: { hotelId } })
    .then((r) => r.data);
export const getSentiment = (hotelId) =>
  apiClient
    .get("/api/analytics/sentiment", { params: params(hotelId) })
    .then((r) => r.data);
