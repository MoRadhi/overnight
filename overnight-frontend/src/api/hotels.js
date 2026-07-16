import apiClient from "./apiClient";

// ── Public read ───────────────────────────────────────────────────────────────

/** All hotels, optionally filtered by country (e.g. "Japan") */
export const fetchHotels = (country) =>
  apiClient
    .get("/api/hotels", { params: country ? { country } : {} })
    .then((r) => r.data);

/** Single hotel by id */
export const fetchHotel = (id) =>
  apiClient.get(`/api/hotels/${id}`).then((r) => r.data);

/** Sorted list of distinct country names that have at least one hotel */
export const fetchCountries = () =>
  apiClient.get("/api/hotels/countries").then((r) => r.data);

/** Room types belonging to a specific hotel */
export const fetchRoomTypes = (hotelId) =>
  apiClient.get(`/api/hotels/${hotelId}/room-types`).then((r) => r.data);

// ── Backward-compatible aliases ───────────────────────────────────────────────
// Analytics.jsx uses getHotels; Rooms.jsx uses getRoomTypes; keep in sync above.
export const getHotels = fetchHotels;
export const getHotel = fetchHotel;
export const getRoomTypes = fetchRoomTypes;

// ── Admin CRUD ────────────────────────────────────────────────────────────────

/** POST /api/hotels — HotelRequest: { name, address, city, country, description, imageUrl } */
export const createHotel = (data) =>
  apiClient.post("/api/hotels", data).then((r) => r.data);

/** PUT /api/hotels/:id */
export const updateHotel = (id, data) =>
  apiClient.put(`/api/hotels/${id}`, data).then((r) => r.data);

/** DELETE /api/hotels/:id */
export const deleteHotel = (id) => apiClient.delete(`/api/hotels/${id}`);
