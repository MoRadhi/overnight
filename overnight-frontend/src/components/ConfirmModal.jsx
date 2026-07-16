import { Modal, Button, Spinner } from "react-bootstrap";

export default function ConfirmModal({
  show,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
  confirmLabel,
  confirmVariant,
}) {
  const isDanger = (confirmVariant ?? "danger") === "danger";

  return (
    <Modal
      show={show}
      onHide={onCancel}
      centered
      contentClassName="overnight-modal"
    >
      <Modal.Header
        style={{
          background: "var(--on-surface)",
          border: "1px solid var(--on-border)",
          borderBottom: "none",
          color: "var(--on-text)",
        }}
      >
        <Modal.Title className="font-display" style={{ fontSize: "1.1rem" }}>
          {title ?? "Confirm"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body
        style={{
          background: "var(--on-surface)",
          color: "var(--on-text)",
        }}
      >
        {message ?? "Are you sure? This cannot be undone."}
      </Modal.Body>
      <Modal.Footer
        style={{
          background: "var(--on-surface)",
          border: "1px solid var(--on-border)",
          borderTop: "none",
        }}
      >
        <Button
          variant="outline-light"
          onClick={onCancel}
          disabled={loading}
          style={{
            color: "var(--on-text)",
            borderColor: "#56607a",
          }}
        >
          Cancel
        </Button>
        <Button
          variant={isDanger ? undefined : "primary"}
          onClick={onConfirm}
          disabled={loading}
          style={
            isDanger
              ? {
                  background: "var(--on-danger)",
                  border: "none",
                  color: "#fff",
                }
              : undefined
          }
        >
          {loading ? (
            <Spinner animation="border" size="sm" />
          ) : (
            (confirmLabel ?? "Delete")
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
