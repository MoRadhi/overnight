import apiClient from "./apiClient";

export const createReservation = (data) =>
  apiClient.post("/api/reservations", data).then((r) => r.data);

export const getReservations = (hotelId) =>
  apiClient
    .get("/api/reservations", { params: hotelId ? { hotelId } : {} })
    .then((r) => r.data);

export const updateStatus = (id, status) =>
  apiClient
    .patch(`/api/reservations/${id}/status`, { status })
    .then((r) => r.data);

export const submitReview = (id, data) =>
  apiClient.post(`/api/reservations/${id}/review`, data).then((r) => r.data);
