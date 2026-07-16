import { useState } from "react";
import { Container, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { authenticate } from "../../api/auth";
import { useAuth } from "../../context/useAuth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await authenticate(username, password);
      login(token);
      navigate("/admin/reservations");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(detail ?? "Login failed — check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="py-5 d-flex justify-content-center">
      <Card
        style={{
          maxWidth: 400,
          width: "100%",
          background: "var(--on-surface)",
          border: "1px solid var(--on-border)",
          borderRadius: "var(--on-radius-lg)",
          boxShadow: "var(--on-shadow-glow)",
        }}
      >
        <Card.Body className="p-4">
          <h1 className="font-display mb-1" style={{ fontSize: "1.5rem" }}>
            Admin login
          </h1>
          <p
            style={{
              color: "var(--on-text-muted)",
              fontSize: "0.88rem",
              marginBottom: "1.5rem",
            }}
          >
            Overnight staff only.
          </p>

          {error && (
            <Alert
              style={{
                background: "rgba(217,104,95,0.12)",
                border: "1px solid rgba(217,104,95,0.3)",
                color: "var(--on-text)",
                fontSize: "0.88rem",
              }}
            >
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label
                style={{ color: "var(--on-text-muted)", fontSize: "0.85rem" }}
              >
                Username
              </Form.Label>
              <Form.Control
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label
                style={{ color: "var(--on-text-muted)", fontSize: "0.85rem" }}
              >
                Password
              </Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Logging in…
                </>
              ) : (
                "Log in"
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
