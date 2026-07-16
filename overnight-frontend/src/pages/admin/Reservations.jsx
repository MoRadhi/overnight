import { useEffect, useState } from "react";
import {
  Container,
  Table,
  Button,
  Form,
  Row,
  Col,
  Spinner,
  Alert,
} from "react-bootstrap";
import { getHotels } from "../../api/hotels";
import { getReservations, updateStatus } from "../../api/reservations";
import StatusBadge from "../../components/StatusBadge";
import ConfirmModal from "../../components/ConfirmModal";

const STATUS_FILTERS = [
  "ALL",
  "BOOKED",
  "CHECKED_IN",
  "CHECKED_OUT",
  "CANCELLED",
];

export default function Reservations() {
  const [hotels, setHotels] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [hotelFilter, setHotelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Status action
  const [actionTarget, setActionTarget] = useState(null); // { reservation, newStatus, label }
  const [actioning, setActioning] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    getHotels()
      .then(setHotels)
      .catch(() => {});
    load();
  }, []);

  async function load(hId) {
    setLoading(true);
    try {
      setReservations(await getReservations(hId || undefined));
    } catch {
      setError("Failed to load reservations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(hotelFilter || undefined);
  }, [hotelFilter]);

  async function handleStatusAction() {
    setActioning(true);
    setActionError(null);
    try {
      await updateStatus(actionTarget.reservation.id, actionTarget.newStatus);
      setActionTarget(null);
      await load(hotelFilter || undefined);
    } catch (err) {
      setActionError(err.response?.data?.detail ?? "Action failed.");
      setActioning(false);
    }
  }

  function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso + "T12:00:00").toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const filtered = reservations.filter(
    (r) => statusFilter === "ALL" || r.status === statusFilter,
  );

  const surface = {
    background: "var(--on-surface)",
    border: "1px solid var(--on-border)",
  };
  const thStyle = {
    padding: "0.75rem 1rem",
    fontWeight: 500,
    fontSize: "0.82rem",
    color: "var(--on-text-muted)",
    whiteSpace: "nowrap",
  };
  const tdStyle = { padding: "0.75rem 1rem", verticalAlign: "middle" };

  return (
    <Container className="py-5">
      <h1 className="font-display mb-4" style={{ fontSize: "1.8rem" }}>
        Reservations
      </h1>

      {/* Filters */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <Form.Select
            value={hotelFilter}
            onChange={(e) => setHotelFilter(e.target.value)}
            style={{ fontSize: "0.9rem" }}
          >
            <option value="">All hotels</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ fontSize: "0.9rem" }}
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "ALL"
                  ? "All statuses"
                  : s
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={4} className="d-flex align-items-center">
          <span style={{ color: "var(--on-text-muted)", fontSize: "0.85rem" }}>
            {filtered.length} reservation{filtered.length !== 1 ? "s" : ""}
          </span>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div
          className="d-flex align-items-center gap-2"
          style={{ color: "var(--on-text-muted)" }}
        >
          <Spinner animation="border" size="sm" /> Loading…
        </div>
      ) : (
        <div
          style={{
            ...surface,
            borderRadius: "var(--on-radius-lg)",
            overflow: "hidden",
          }}
        >
          <Table
            responsive
            className="mb-0"
            style={{ color: "var(--on-text)" }}
          >
            <thead
              style={{
                background: "var(--on-surface-raised)",
                borderBottom: "1px solid var(--on-border)",
              }}
            >
              <tr>
                {[
                  "#",
                  "Guest",
                  "Hotel",
                  "Room",
                  "Check-in",
                  "Check-out",
                  "Total",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      color: "var(--on-text-muted)",
                    }}
                  >
                    No reservations found.
                  </td>
                </tr>
              )}
              {filtered.map((r, i) => (
                <tr
                  key={r.id}
                  style={{
                    borderTop: i === 0 ? "none" : "1px solid var(--on-border)",
                  }}
                >
                  <td
                    style={{
                      ...tdStyle,
                      color: "var(--on-text-faint)",
                      fontSize: "0.8rem",
                    }}
                  >
                    #{r.id}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 500 }}>
                      {r.guestFirstName} {r.guestLastName}
                    </div>
                    <div
                      style={{
                        color: "var(--on-text-muted)",
                        fontSize: "0.8rem",
                      }}
                    >
                      {r.guestEmail}
                    </div>
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      color: "var(--on-text-muted)",
                      fontSize: "0.88rem",
                    }}
                  >
                    {r.hotelName}
                  </td>
                  <td style={{ ...tdStyle, fontSize: "0.88rem" }}>
                    <div>{r.roomTypeName}</div>
                    <div
                      style={{
                        color: "var(--on-text-muted)",
                        fontSize: "0.78rem",
                      }}
                    >
                      Room {r.roomNumber}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontSize: "0.88rem" }}>
                    {formatDate(r.checkInDate)}
                  </td>
                  <td style={{ ...tdStyle, fontSize: "0.88rem" }}>
                    {formatDate(r.checkOutDate)}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      color: "var(--on-accent)",
                      fontWeight: 600,
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    €{Number(r.totalPrice).toFixed(0)}
                  </td>
                  <td style={tdStyle}>
                    <StatusBadge status={r.status} />
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    {r.status === "BOOKED" && (
                      <Button
                        size="sm"
                        className="me-1"
                        variant="outline-light"
                        onClick={() =>
                          setActionTarget({
                            reservation: r,
                            newStatus: "CHECKED_IN",
                            label: "Check in",
                          })
                        }
                        style={{ fontSize: "0.78rem" }}
                      >
                        Check in
                      </Button>
                    )}
                    {r.status === "CHECKED_IN" && (
                      <Button
                        size="sm"
                        className="me-1"
                        variant="outline-light"
                        onClick={() =>
                          setActionTarget({
                            reservation: r,
                            newStatus: "CHECKED_OUT",
                            label: "Check out",
                          })
                        }
                        style={{ fontSize: "0.78rem" }}
                      >
                        Check out
                      </Button>
                    )}
                    {(r.status === "BOOKED" || r.status === "CHECKED_IN") && (
                      <Button
                        size="sm"
                        onClick={() =>
                          setActionTarget({
                            reservation: r,
                            newStatus: "CANCELLED",
                            label: "Cancel",
                          })
                        }
                        style={{
                          background: "var(--on-danger)",
                          border: "none",
                          fontSize: "0.78rem",
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    {(r.status === "CHECKED_OUT" ||
                      r.status === "CANCELLED") && (
                      <span
                        style={{
                          color: "var(--on-text-faint)",
                          fontSize: "0.78rem",
                        }}
                      >
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Status action confirmation */}
      <ConfirmModal
        show={!!actionTarget}
        title={actionTarget?.label}
        message={
          actionTarget
            ? `${actionTarget.label} reservation #${actionTarget.reservation.id} for ${actionTarget.reservation.guestFirstName} ${actionTarget.reservation.guestLastName}?`
            : ""
        }
        confirmLabel="Confirm"
        confirmVariant="primary"
        onConfirm={handleStatusAction}
        onCancel={() => {
          setActionTarget(null);
          setActionError(null);
        }}
        loading={actioning}
      />

      {actionError && (
        <Alert
          variant="danger"
          className="mt-3"
          dismissible
          onClose={() => setActionError(null)}
        >
          {actionError}
        </Alert>
      )}
    </Container>
  );
}
