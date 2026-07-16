import { useEffect, useState } from "react";
import {
  Container,
  Table,
  Button,
  Modal,
  Form,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  getHotels,
  createHotel,
  updateHotel,
  deleteHotel,
} from "../../api/hotels";
import ConfirmModal from "../../components/ConfirmModal";

const EMPTY_FORM = {
  name: "",
  address: "",
  city: "",
  country: "",
  description: "",
  imageUrl: "",
};

export default function Hotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form modal
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, hotel obj = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete modal
  const [delTarget, setDelTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      setHotels(await getHotels());
    } catch {
      setError("Failed to load hotels.");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(hotel) {
    setEditing(hotel);
    setForm({
      name: hotel.name,
      address: hotel.address,
      city: hotel.city,
      country: hotel.country,
      description: hotel.description ?? "",
      imageUrl: hotel.imageUrl ?? "",
    });
    setFormError(null);
    setShowForm(true);
  }

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await updateHotel(editing.id, form);
      } else {
        await createHotel(form);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(
        err.response?.data?.detail ?? "Save failed. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteHotel(delTarget.id);
      setDelTarget(null);
      await load();
    } catch {
      setDeleting(false);
    } finally {
      setDeleting(false);
    }
  }

  const surface = {
    background: "var(--on-surface)",
    border: "1px solid var(--on-border)",
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="font-display mb-0" style={{ fontSize: "1.8rem" }}>
          Hotels
        </h1>
        <Button variant="primary" onClick={openCreate}>
          + Add hotel
        </Button>
      </div>

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
                {["Name", "City", "Country", "Address", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "0.85rem 1rem",
                      fontWeight: 500,
                      fontSize: "0.82rem",
                      color: "var(--on-text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hotels.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "var(--on-text-muted)",
                    }}
                  >
                    No hotels yet.
                  </td>
                </tr>
              )}
              {hotels.map((h, i) => (
                <tr
                  key={h.id}
                  style={{
                    borderTop: i === 0 ? "none" : "1px solid var(--on-border)",
                  }}
                >
                  <td style={{ padding: "0.85rem 1rem", fontWeight: 500 }}>
                    {h.name}
                  </td>
                  <td
                    style={{
                      padding: "0.85rem 1rem",
                      color: "var(--on-text-muted)",
                    }}
                  >
                    {h.city}
                  </td>
                  <td
                    style={{
                      padding: "0.85rem 1rem",
                      color: "var(--on-text-muted)",
                    }}
                  >
                    {h.country}
                  </td>
                  <td
                    style={{
                      padding: "0.85rem 1rem",
                      color: "var(--on-text-muted)",
                      fontSize: "0.88rem",
                    }}
                  >
                    {h.address}
                  </td>
                  <td
                    style={{
                      padding: "0.85rem 1rem",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Button
                      size="sm"
                      variant="outline-light"
                      className="me-2"
                      onClick={() => openEdit(h)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setDelTarget(h)}
                      style={{ background: "var(--on-danger)", border: "none" }}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Modal.Header style={{ ...surface, borderBottom: "none" }}>
          <Modal.Title className="font-display" style={{ fontSize: "1.1rem" }}>
            {editing ? "Edit hotel" : "Add hotel"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body style={{ ...surface, paddingTop: 0 }}>
            {formError && (
              <Alert variant="danger" className="mb-3">
                {formError}
              </Alert>
            )}
            <Form.Group className="mb-3">
              <Form.Label
                style={{ color: "var(--on-text-muted)", fontSize: "0.85rem" }}
              >
                Name
              </Form.Label>
              <Form.Control {...field("name")} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label
                style={{ color: "var(--on-text-muted)", fontSize: "0.85rem" }}
              >
                Address
              </Form.Label>
              <Form.Control {...field("address")} required />
            </Form.Group>
            <div className="d-flex gap-3">
              <Form.Group className="flex-grow-1 mb-3">
                <Form.Label
                  style={{ color: "var(--on-text-muted)", fontSize: "0.85rem" }}
                >
                  City
                </Form.Label>
                <Form.Control {...field("city")} required />
              </Form.Group>
              <Form.Group className="flex-grow-1 mb-3">
                <Form.Label
                  style={{ color: "var(--on-text-muted)", fontSize: "0.85rem" }}
                >
                  Country
                </Form.Label>
                <Form.Control {...field("country")} required />
              </Form.Group>
            </div>
            <Form.Group className="mb-3">
              <Form.Label
                style={{ color: "var(--on-text-muted)", fontSize: "0.85rem" }}
              >
                Description
              </Form.Label>
              <Form.Control as="textarea" rows={3} {...field("description")} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label
                style={{ color: "var(--on-text-muted)", fontSize: "0.85rem" }}
              >
                Image URL
              </Form.Label>
              <Form.Control
                placeholder="https://images.unsplash.com/photo-..."
                {...field("imageUrl")}
              />
              <Form.Text style={{ color: "var(--on-text-muted)" }}>
                Used on property cards and detail pages.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ ...surface, borderTop: "none" }}>
            <Button
              variant="outline-light"
              onClick={() => setShowForm(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? (
                <Spinner animation="border" size="sm" />
              ) : editing ? (
                "Save changes"
              ) : (
                "Add hotel"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmModal
        show={!!delTarget}
        title="Delete hotel"
        message={`Delete "${delTarget?.name}"? This will also remove all its room types and rooms.`}
        onConfirm={handleDelete}
        onCancel={() => setDelTarget(null)}
        loading={deleting}
      />
    </Container>
  );
}
