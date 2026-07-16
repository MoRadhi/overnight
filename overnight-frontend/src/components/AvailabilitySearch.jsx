import { useState } from "react";
import { Form, Button, Row, Col, Spinner, Alert } from "react-bootstrap";
import { checkAvailability } from "../api/rooms";

export default function AvailabilitySearch({ hotelId, onResults }) {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [checkIn, setCheckIn] = useState(tomorrow);
  const [checkOut, setCheckOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    if (!checkIn || !checkOut) {
      setError("Please select both check-in and check-out dates.");
      return;
    }
    if (checkIn >= checkOut) {
      setError("Check-out must be after check-in.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const rooms = await checkAvailability(hotelId, checkIn, checkOut);
      onResults(rooms, checkIn, checkOut);
    } catch {
      setError("Availability search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "var(--on-surface-raised)",
        border: "1px solid var(--on-border)",
        borderRadius: "var(--on-radius-lg)",
        padding: "1.5rem",
        boxShadow: "var(--on-shadow-glow)",
      }}
    >
      <p
        className="font-display mb-3"
        style={{ fontSize: "1.05rem", margin: 0 }}
      >
        Check availability
      </p>

      {error && (
        <Alert
          variant="danger"
          style={{
            background: "rgba(217,104,95,0.12)",
            border: "1px solid rgba(217,104,95,0.3)",
            color: "var(--on-text)",
          }}
        >
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSearch}>
        <Row className="g-3 align-items-end">
          <Col md={4}>
            <Form.Label
              style={{ color: "var(--on-text-muted)", fontSize: "0.85rem" }}
            >
              Check-in
            </Form.Label>
            <Form.Control
              type="date"
              min={today}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
            />
          </Col>
          <Col md={4}>
            <Form.Label
              style={{ color: "var(--on-text-muted)", fontSize: "0.85rem" }}
            >
              Check-out
            </Form.Label>
            <Form.Control
              type="date"
              min={checkIn || today}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              required
            />
          </Col>
          <Col md={4}>
            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Searching…
                </>
              ) : (
                "Search"
              )}
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
