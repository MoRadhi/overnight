import apiClient from "./apiClient";

/**
 * Named "authenticate" to avoid shadowing the "login" function
 * imported from AuthContext in Login.jsx.
 */
export const authenticate = (username, password) =>
  apiClient.post("/api/auth/login", { username, password }).then((r) => r.data);
