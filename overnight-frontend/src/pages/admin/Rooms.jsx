import { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Table,
  Button,
  Modal,
  Spinner,
  Alert,
  Badge,
} from "react-bootstrap";
import { getHotels, getRoomTypes } from "../../api/hotels";
import {
  createRoomType,
  updateRoomType,
  deleteRoomType,
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from "../../api/rooms";
import ConfirmModal from "../../components/ConfirmModal";

const EMPTY_RT = { name: "", description: "", basePrice: "", capacity: 2 };
const EMPTY_RM = { roomNumber: "", floor: 0, status: "AVAILABLE" };

export default function Rooms() {
  const [hotels, setHotels] = useState([]);
  const [hotelId, setHotelId] = useState("");
  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedRt, setSelectedRt] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // Room type modal
  const [showRtModal, setShowRtModal] = useState(false);
  const [editingRt, setEditingRt] = useState(null);
  const [rtForm, setRtForm] = useState(EMPTY_RT);
  const [savingRt, setSavingRt] = useState(false);
  const [rtError, setRtError] = useState(null);
  const [delRt, setDelRt] = useState(null);
  const [deletingRt, setDeletingRt] = useState(false);

  // Room modal
  const [showRmModal, setShowRmModal] = useState(false);
  const [editingRm, setEditingRm] = useState(null);
  const [rmForm, setRmForm] = useState(EMPTY_RM);
  const [savingRm, setSavingRm] = useState(false);
  const [rmError, setRmError] = useState(null);
  const [delRm, setDelRm] = useState(null);
  const [deletingRm, setDeletingRm] = useState(false);

  useEffect(() => {
    getHotels()
      .then(setHotels)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!hotelId) {
      setRoomTypes([]);
      setSelectedRt(null);
      setRooms([]);
      return;
    }
    setLoading(true);
    getRoomTypes(hotelId)
      .then((rt) => {
        setRoomTypes(rt);
        setSelectedRt(null);
        setRooms([]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hotelId]);

  useEffect(() => {
    if (!selectedRt) {
      setRooms([]);
      return;
    }
    getRooms(selectedRt.id)
      .then(setRooms)
      .catch(() => {});
  }, [selectedRt]);

  // ── Room type helpers ───────────────────────────────────────────────────────
  const rtField = (k) => ({
    value: rtForm[k],
    onChange: (e) => setRtForm((f) => ({ ...f, [k]: e.target.value })),
  });

  function openCreateRt() {
    setEditingRt(null);
    setRtForm(EMPTY_RT);
    setRtError(null);
    setShowRtModal(true);
  }
  function openEditRt(rt) {
    setEditingRt(rt);
    setRtForm({
      name: rt.name,
      description: rt.description ?? "",
      basePrice: rt.basePrice,
      capacity: rt.capacity,
    });
    setRtError(null);
    setShowRtModal(true);
  }

  async function saveRt(e) {
    e.preventDefault();
    setSavingRt(true);
    setRtError(null);
    try {
      const body = {
        ...rtForm,
        hotelId: Number(hotelId),
        basePrice: Number(rtForm.basePrice),
        capacity: Number(rtForm.capacity),
      };
      if (editingRt) await updateRoomType(editingRt.id, body);
      else await createRoomType(body);
      setShowRtModal(false);
      const updated = await getRoomTypes(hotelId);
      setRoomTypes(updated);
      if (editingRt && selectedRt?.id === editingRt.id) {
        setSelectedRt(updated.find((r) => r.id === editingRt.id) ?? null);
      }
    } catch (err) {
      setRtError(err.response?.data?.detail ?? "Save failed.");
    } finally {
      setSavingRt(false);
    }
  }

  async function handleDeleteRt() {
    setDeletingRt(true);
    try {
      await deleteRoomType(delRt.id);
      setDelRt(null);
      if (selectedRt?.id === delRt.id) {
        setSelectedRt(null);
        setRooms([]);
      }
      setRoomTypes((rt) => rt.filter((r) => r.id !== delRt.id));
    } catch {
    } finally {
      setDeletingRt(false);
    }
  }

  // ── Room helpers ─────────────────────────────────────────────────────────────
  const rmField = (k) => ({
    value: rmForm[k],
    onChange: (e) => setRmForm((f) => ({ ...f, [k]: e.target.value })),
  });

  function openCreateRm() {
    setEditingRm(null);
    setRmForm(EMPTY_RM);
    setRmError(null);
    setShowRmModal(true);
  }
  function openEditRm(rm) {
    setEditingRm(rm);
    setRmForm({
      roomNumber: rm.roomNumber,
      floor: rm.floor,
      status: rm.status,
    });
    setRmError(null);
    setShowRmModal(true);
  }

  async function saveRm(e) {
    e.preventDefault();
    setSavingRm(true);
    setRmError(null);
    try {
      const body = {
        ...rmForm,
        roomTypeId: selectedRt.id,
        floor: Number(rmForm.floor),
      };
      if (editingRm) await updateRoom(editingRm.id, body);
      else await createRoom(body);
      setShowRmModal(false);
      setRooms(await getRooms(selectedRt.id));
    } catch (err) {
      setRmError(err.response?.data?.detail ?? "Save failed.");
    } finally {
      setSavingRm(false);
    }
  }

  async function handleDeleteRm() {
    setDeletingRm(true);
    try {
      await deleteRoom(delRm.id);
      setDelRm(null);
      setRooms((rm) => rm.filter((r) => r.id !== delRm.id));
    } catch {
    } finally {
      setDeletingRm(false);
    }
  }

  const surface = {
    background: "var(--on-surface)",
    border: "1px solid var(--on-border)",
  };
  const thStyle = {
    padding: "0.75rem 1rem",
    fontWeight: 500,
    fontSize: "0.82rem",
    color: "var(--on-text-muted)",
  };
  const tdStyle = { padding: "0.75rem 1rem" };

  return (
    <Container className="py-5">
      <h1 className="font-display mb-4" style={{ fontSize: "1.8rem" }}>
        Rooms
      </h1>

      {/* Hotel selector */}
      <Form.Group className="mb-4" style={{ maxWidth: 320 }}>
        <Form.Label
          style={{ color: "var(--on-text-muted)", fontSize: "0.85rem" }}
        >
          Select hotel
        </Form.Label>
        <Form.Select
          value={hotelId}
          onChange={(e) => setHotelId(e.target.value)}
        >
          <option value="">Choose a hotel…</option>
          {hotels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name} — {h.city}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {loading && (
        <div
          className="d-flex align-items-center gap-2 mb-4"
          style={{ color: "var(--on-text-muted)" }}
        >
          <Spinner animation="border" size="sm" />
          Loading…
        </div>
      )}

      {hotelId && !loading && (
        <Row className="g-4">
          {/* Room Types */}
          <Col md={5}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h2 className="font-display mb-0" style={{ fontSize: "1.1rem" }}>
                Room types
              </h2>
              <Button size="sm" variant="primary" onClick={openCreateRt}>
                + Add
              </Button>
            </div>
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
                <thead style={{ background: "var(--on-surface-raised)" }}>
                  <tr>
                    {["Name", "Price/night", ""].map((h) => (
                      <th key={h} style={thStyle}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roomTypes.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        style={{
                          ...tdStyle,
                          color: "var(--on-text-muted)",
                          textAlign: "center",
                        }}
                      >
                        No room types.
                      </td>
                    </tr>
                  )}
                  {roomTypes.map((rt, i) => {
                    const isSelected = selectedRt?.id === rt.id;
                    return (
                      <tr
                        key={rt.id}
                        onClick={() => setSelectedRt(isSelected ? null : rt)}
                        style={{
                          borderTop:
                            i === 0 ? "none" : "1px solid var(--on-border)",
                          cursor: "pointer",
                          background: isSelected
                            ? "var(--on-accent-soft)"
                            : "transparent",
                          transition: "background 0.15s",
                        }}
                      >
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 500 }}>{rt.name}</span>
                          <span
                            style={{
                              color: "var(--on-text-faint)",
                              fontSize: "0.8rem",
                              marginLeft: 6,
                            }}
                          >
                            · {rt.capacity} guests
                          </span>
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            color: "var(--on-accent)",
                            fontWeight: 600,
                          }}
                        >
                          €{Number(rt.basePrice).toFixed(0)}
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "right",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <Button
                            size="sm"
                            variant="outline-light"
                            className="me-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditRt(rt);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDelRt(rt);
                            }}
                            style={{
                              background: "var(--on-danger)",
                              border: "none",
                            }}
                          >
                            Del
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
            {selectedRt && (
              <p
                style={{
                  color: "var(--on-text-muted)",
                  fontSize: "0.8rem",
                  marginTop: 6,
                }}
              >
                Showing rooms for:{" "}
                <strong style={{ color: "var(--on-text)" }}>
                  {selectedRt.name}
                </strong>
              </p>
            )}
          </Col>

          {/* Rooms */}
          <Col md={7}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h2 className="font-display mb-0" style={{ fontSize: "1.1rem" }}>
                {selectedRt ? `Rooms — ${selectedRt.name}` : "Rooms"}
              </h2>
              {selectedRt && (
                <Button size="sm" variant="primary" onClick={openCreateRm}>
                  + Add
                </Button>
              )}
            </div>
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
                <thead style={{ background: "var(--on-surface-raised)" }}>
                  <tr>
                    {["Room no.", "Floor", "Status", ""].map((h) => (
                      <th key={h} style={thStyle}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!selectedRt && (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          ...tdStyle,
                          color: "var(--on-text-muted)",
                          textAlign: "center",
                        }}
                      >
                        Select a room type to view its rooms.
                      </td>
                    </tr>
                  )}
                  {selectedRt && rooms.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          ...tdStyle,
                          color: "var(--on-text-muted)",
                          textAlign: "center",
                        }}
                      >
                        No rooms yet.
                      </td>
                    </tr>
                  )}
                  {rooms.map((rm, i) => (
                    <tr
                      key={rm.id}
                      style={{
                        borderTop:
                          i === 0 ? "none" : "1px solid var(--on-border)",
                      }}
                    >
                      <td style={{ ...tdStyle, fontWeight: 500 }}>
                        {rm.roomNumber}
                      </td>
                      <td style={{ ...tdStyle, color: "var(--on-text-muted)" }}>
                        {rm.floor}
                      </td>
                      <td style={tdStyle}>
                        <Badge
                          style={{
                            background:
                              rm.status === "AVAILABLE"
                                ? "rgba(111,191,138,0.15)"
                                : "rgba(217,104,95,0.15)",
                            color:
                              rm.status === "AVAILABLE"
                                ? "var(--on-success)"
                                : "var(--on-danger)",
                            fontWeight: 500,
                            fontSize: "0.75rem",
                            padding: "3px 9px",
                            borderRadius: "99px",
                          }}
                        >
                          {rm.status === "AVAILABLE"
                            ? "Available"
                            : "Maintenance"}
                        </Badge>
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Button
                          size="sm"
                          variant="outline-light"
                          className="me-1"
                          onClick={() => openEditRm(rm)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setDelRm(rm)}
                          style={{
                            background: "var(--on-danger)",
                            border: "none",
                          }}
                        >
                          Del
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Col>
        </Row>
      )}

      {/* Room type modal */}
      <Modal show={showRtModal} onHide={() => setShowRtModal(false)} centered>
        <Modal.Header style={{ ...surface, borderBottom: "none" }}>
          <Modal.Title className="font-display" style={{ fontSize: "1.1rem" }}>
            {editingRt ? "Edit room type" : "Add room type"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={saveRt}>
          <Modal.Body style={{ ...surface, paddingTop: 0 }}>
            {rtError && <Alert variant="danger">{rtError}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label
                style={{ color: "var(--on-text-muted)", fontSize: "0.85rem" }}
              >
                Name
              </Form.Label>
              <Form.Control {...rtField("name")} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label
                style={{ color: "var(--on-text-muted)", fontSize: "0.85rem" }}
              >
                Description
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                {...rtField("description")}
              />
            </Form.Group>
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      color: "var(--on-text-muted)",
                      fontSize: "0.85rem",
                    }}
                  >
                    Base price (€/night)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="0.01"
                    step="0.01"
                    {...rtField("basePrice")}
                    required
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      color: "var(--on-text-muted)",
                      fontSize: "0.85rem",
                    }}
                  >
                    Max guests
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    {...rtField("capacity")}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer style={{ ...surface, borderTop: "none" }}>
            <Button
              variant="outline-light"
              onClick={() => setShowRtModal(false)}
              disabled={savingRt}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={savingRt}>
              {savingRt ? (
                <Spinner animation="border" size="sm" />
              ) : editingRt ? (
                "Save"
              ) : (
                "Add"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Room modal */}
      <Modal show={showRmModal} onHide={() => setShowRmModal(false)} centered>
        <Modal.Header style={{ ...surface, borderBottom: "none" }}>
          <Modal.Title className="font-display" style={{ fontSize: "1.1rem" }}>
            {editingRm ? "Edit room" : "Add room"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={saveRm}>
          <Modal.Body style={{ ...surface, paddingTop: 0 }}>
            {rmError && <Alert variant="danger">{rmError}</Alert>}
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      color: "var(--on-text-muted)",
                      fontSize: "0.85rem",
                    }}
                  >
                    Room number
                  </Form.Label>
                  <Form.Control {...rmField("roomNumber")} required />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label
                    style={{
                      color: "var(--on-text-muted)",
                      fontSize: "0.85rem",
                    }}
                  >
                    Floor
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    {...rmField("floor")}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group>
              <Form.Label
                style={{ color: "var(--on-text-muted)", fontSize: "0.85rem" }}
              >
                Status
              </Form.Label>
              <Form.Select {...rmField("status")}>
                <option value="AVAILABLE">Available</option>
                <option value="MAINTENANCE">Maintenance</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ ...surface, borderTop: "none" }}>
            <Button
              variant="outline-light"
              onClick={() => setShowRmModal(false)}
              disabled={savingRm}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={savingRm}>
              {savingRm ? (
                <Spinner animation="border" size="sm" />
              ) : editingRm ? (
                "Save"
              ) : (
                "Add"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmModal
        show={!!delRt}
        title="Delete room type"
        message={`Delete "${delRt?.name}"? All rooms under it will also be removed.`}
        onConfirm={handleDeleteRt}
        onCancel={() => setDelRt(null)}
        loading={deletingRt}
      />
      <ConfirmModal
        show={!!delRm}
        title="Delete room"
        message={`Delete room "${delRm?.roomNumber}"?`}
        onConfirm={handleDeleteRm}
        onCancel={() => setDelRm(null)}
        loading={deletingRm}
      />
    </Container>
  );
}
