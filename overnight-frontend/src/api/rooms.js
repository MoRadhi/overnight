import apiClient from "./apiClient";

export const checkAvailability = (hotelId, checkIn, checkOut) =>
  apiClient
    .get("/api/rooms/availability", { params: { hotelId, checkIn, checkOut } })
    .then((r) => r.data);

// Room Types
export const getRoomType = (id) =>
  apiClient.get(`/api/room-types/${id}`).then((r) => r.data);
export const createRoomType = (data) =>
  apiClient.post("/api/room-types", data).then((r) => r.data);
export const updateRoomType = (id, data) =>
  apiClient.put(`/api/room-types/${id}`, data).then((r) => r.data);
export const deleteRoomType = (id) => apiClient.delete(`/api/room-types/${id}`);

// Rooms
export const getRooms = (roomTypeId) =>
  apiClient.get(`/api/room-types/${roomTypeId}/rooms`).then((r) => r.data);
export const createRoom = (data) =>
  apiClient.post("/api/rooms", data).then((r) => r.data);
export const updateRoom = (id, data) =>
  apiClient.put(`/api/rooms/${id}`, data).then((r) => r.data);
export const deleteRoom = (id) => apiClient.delete(`/api/rooms/${id}`);
