import { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Form, Spinner, Alert, Button } from "react-bootstrap";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { getHotels } from "../../api/hotels";
import {
  getSegments,
  getSummary,
  getForecast,
  getSentiment,
} from "../../api/analytics";
import apiClient from "../../api/apiClient";
import { useKeyedCache } from "../../hooks/useKeyedCache";

// ── Design tokens ─────────────────────────────────────────────────────────────
const ACCENT = "#E8A23D";
const TEAL = "#4FA8A0";
const DANGER = "#D9685F";
const SUCCESS = "#6FBF8A";
const MUTED = "#9CA3AF";
const BORDER = "#2C3142";
const SURFACE = "#1B1F2A";

const SEGMENT_COLORS = {
  Champions: ACCENT,
  Loyal: TEAL,
  "Potential Loyalist": "#7C82E8",
  "At Risk": DANGER,
  New: SUCCESS,
  Lost: MUTED,
};

const TOOLTIP_STYLE = {
  background: "#232838",
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  color: "#F2F0EB",
  fontSize: "0.82rem",
};

// ── Small reusable pieces ─────────────────────────────────────────────────────

function SectionCard({ title, children, loading }) {
  return (
    <div
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: "1.5rem",
      }}
    >
      <p
        className="font-display mb-3"
        style={{ fontSize: "1rem", margin: 0, marginBottom: "1rem" }}
      >
        {title}
      </p>
      {loading ? (
        <div
          style={{
            color: MUTED,
            fontSize: "0.85rem",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <Spinner animation="border" size="sm" /> Loading…
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function KpiCard({ label, value, sub }) {
  return (
    <div
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: "1.25rem 1.5rem",
      }}
    >
      <p style={{ color: MUTED, fontSize: "0.8rem", margin: 0 }}>{label}</p>
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.8rem",
          fontWeight: 700,
          color: ACCENT,
          margin: "2px 0 0",
        }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ color: MUTED, fontSize: "0.78rem", margin: 0 }}>{sub}</p>
      )}
    </div>
  );
}

function HealthPill({ status, label }) {
  const palette = {
    healthy: { bg: "rgba(111,191,138,0.15)", color: SUCCESS, text: "Healthy" },
    degraded: {
      bg: "rgba(217,104,95,0.15)",
      color: DANGER,
      text: "Degraded",
    },
    unknown: { bg: "rgba(156,163,175,0.15)", color: MUTED, text: "Unknown" },
    checking: { bg: "rgba(232,162,61,0.15)", color: ACCENT, text: "Checking" },
  };
  const cfg = palette[status] ?? palette.unknown;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        background: cfg.bg,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: cfg.color,
        }}
      />
      <span style={{ color: cfg.color, fontWeight: 500, fontSize: "0.78rem" }}>
        {label}: {cfg.text}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Analytics() {
  const [hotels, setHotels] = useState([]);
  const [hotelId, setHotelId] = useState("");

  const [summary, setSummary] = useState(null);
  const [segments, setSegments] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [sentiment, setSentiment] = useState([]);

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingSegments, setLoadingSegments] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [loadingSentiment, setLoadingSentiment] = useState(false);

  const [error, setError] = useState(null);
  const [health, setHealth] = useState({
    backend: "checking",
    analytics: "checking",
    checkedAt: null,
  });
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthNote, setHealthNote] = useState("");

  useEffect(() => {
    getHotels()
      .then(setHotels)
      .catch(() => {});
  }, []);

  // Per-hotel-filter cache so switching back to a previously viewed filter
  // (e.g. "All hotels" -> a hotel -> "All hotels") reuses in-memory data
  // instead of re-hitting the backend/analytics service every time.
  const cache = useKeyedCache();

  const checkSystemHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealth({ backend: "checking", analytics: "checking", checkedAt: null });
    setHealthNote("");

    try {
      await apiClient.get("/api/ping");
    } catch {
      setHealth({
        backend: "degraded",
        analytics: "unknown",
        checkedAt: new Date().toISOString(),
      });
      setHealthNote("Backend ping failed. Check backend service availability.");
      setHealthLoading(false);
      return;
    }

    try {
      await getSummary();
      setHealth({
        backend: "healthy",
        analytics: "healthy",
        checkedAt: new Date().toISOString(),
      });
      setHealthNote("Backend and analytics routes are responding.");
    } catch {
      setHealth({
        backend: "healthy",
        analytics: "degraded",
        checkedAt: new Date().toISOString(),
      });
      setHealthNote(
        "Backend is reachable, but analytics endpoint failed via backend.",
      );
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const load = useCallback((hId, { force = false } = {}) => {
    const key = hId || "all";
    const id = hId || undefined;
    setError(null);

    const cached = cache.get(key);
    if (!force && cached) {
      setSummary(cached.summary);
      setSegments(cached.segments);
      setSentiment(cached.sentiment);
      setForecast(cached.forecast);
      return;
    }

    const entry = { summary: null, segments: [], sentiment: [], forecast: [] };
    cache.set(key, entry);

    setLoadingSummary(true);
    getSummary(id)
      .then((data) => {
        entry.summary = data;
        setSummary(data);
      })
      .catch(() => setError("Could not load analytics summary."))
      .finally(() => setLoadingSummary(false));

    setLoadingSegments(true);
    getSegments(id)
      .then((data) => {
        entry.segments = data;
        setSegments(data);
      })
      .catch(() => {})
      .finally(() => setLoadingSegments(false));

    setLoadingSentiment(true);
    getSentiment(id)
      .then((data) => {
        entry.sentiment = data;
        setSentiment(data);
      })
      .catch(() => {})
      .finally(() => setLoadingSentiment(false));

    if (hId) {
      setLoadingForecast(true);
      getForecast(hId)
        .then((data) => {
          entry.forecast = data;
          setForecast(data);
        })
        .catch(() => {})
        .finally(() => setLoadingForecast(false));
    } else {
      setForecast([]);
    }
  }, [cache]);

  const refresh = useCallback(() => {
    cache.invalidate(hotelId || "all");
    load(hotelId, { force: true });
    checkSystemHealth();
  }, [hotelId, load, checkSystemHealth, cache]);

  useEffect(() => {
    load(hotelId);
  }, [hotelId, load]);

  useEffect(() => {
    checkSystemHealth();
    // Runs once on mount only - the health check is a general connectivity
    // probe, not per-filter data, so it shouldn't refire on every dropdown change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────
  const segmentPieData = summary?.segmentDistribution
    ? Object.entries(summary.segmentDistribution).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const forecastFormatted = forecast.flatMap((f) => {
    const rawRate =
      f.predictedOccupancyRate ?? f.predicted_occupancy_rate ?? null;
    const numericRate = Number(rawRate);

    if (!Number.isFinite(numericRate)) return [];

    return [
      {
        date: f.date,
        rate: Number((numericRate * 100).toFixed(1)),
      },
    ];
  });

  const forecastMaxRate = forecastFormatted.length
    ? Math.max(...forecastFormatted.map((p) => p.rate))
    : 0;

  // Keep the chart readable for low-occupancy hotels where values may be < 5%.
  const forecastYAxisMax =
    forecastMaxRate <= 10
      ? Math.max(2, Number((forecastMaxRate + 1).toFixed(1)))
      : Math.min(100, Math.ceil((forecastMaxRate + 5) / 5) * 5);

  const tdStyle = {
    padding: "0.65rem 0.9rem",
    verticalAlign: "middle",
    fontSize: "0.85rem",
    borderBottom: `1px solid ${BORDER}`,
  };
  const thStyle = {
    ...tdStyle,
    color: MUTED,
    fontWeight: 500,
    fontSize: "0.78rem",
    background: "#232838",
  };

  return (
    <Container className="py-5">
      {/* Header + hotel filter */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h1 className="font-display mb-0" style={{ fontSize: "1.8rem" }}>
          Analytics
        </h1>
        <Form.Select
          value={hotelId}
          onChange={(e) => setHotelId(e.target.value)}
          style={{ maxWidth: 260, fontSize: "0.88rem" }}
        >
          <option value="">All hotels (group-wide)</option>
          {hotels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </Form.Select>
      </div>

      <div
        style={{
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: "1rem 1.25rem",
          marginBottom: "1rem",
        }}
      >
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <p
            className="font-display"
            style={{ margin: 0, fontSize: "0.95rem", color: "#F2F0EB" }}
          >
            System health
          </p>
          <Button
            size="sm"
            variant="outline-light"
            onClick={refresh}
            disabled={healthLoading}
            style={{ fontSize: "0.75rem" }}
          >
            {healthLoading ? "Checking..." : "Refresh"}
          </Button>
        </div>

        <div className="d-flex gap-2 flex-wrap" style={{ marginTop: "0.65rem" }}>
          <HealthPill status={health.backend} label="Backend" />
          <HealthPill status={health.analytics} label="Analytics" />
        </div>

        <p style={{ color: MUTED, fontSize: "0.78rem", margin: "0.65rem 0 0" }}>
          Last checked:{" "}
          {health.checkedAt
            ? new Date(health.checkedAt).toLocaleTimeString()
            : "not yet"}
          {healthNote ? ` - ${healthNote}` : ""}
        </p>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* KPI row */}
      <Row xs={2} md={4} className="g-3 mb-4">
        <Col>
          <KpiCard
            label="Total revenue"
            value={
              summary
                ? `€${Number(summary.totalRevenue).toLocaleString()}`
                : "—"
            }
          />
        </Col>
        <Col>
          <KpiCard
            label="Completed stays"
            value={summary?.totalCompletedStays ?? "—"}
          />
        </Col>
        <Col>
          <KpiCard
            label="Unique guests"
            value={summary?.totalUniqueGuests ?? "—"}
          />
        </Col>
        <Col>
          <KpiCard
            label="Segments identified"
            value={segmentPieData.length > 0 ? segmentPieData.length : "—"}
            sub={
              segmentPieData.length > 0
                ? "distinct segments"
                : "run RFM after bookings"
            }
          />
        </Col>
      </Row>

      {/* Revenue + Segment distribution */}
      <Row className="g-4 mb-4">
        <Col md={7}>
          <SectionCard
            title="Revenue — last 12 months"
            loading={loadingSummary}
          >
            {summary?.revenueByMonth?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={summary.revenueByMonth}
                  margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                >
                  <XAxis
                    dataKey="month"
                    tick={{ fill: MUTED, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: MUTED, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v) => [
                      `€${Number(v).toLocaleString()}`,
                      "Revenue",
                    ]}
                  />
                  <Bar dataKey="revenue" fill={ACCENT} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: MUTED, fontSize: "0.85rem" }}>
                No completed reservations yet.
              </p>
            )}
          </SectionCard>
        </Col>

        <Col md={5}>
          <SectionCard title="Guest segments" loading={loadingSegments}>
            {segmentPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={segmentPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {segmentPieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={SEGMENT_COLORS[entry.name] ?? TEAL}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "0.78rem", color: MUTED }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: MUTED, fontSize: "0.85rem" }}>
                No segment data — analytics service may be starting up.
              </p>
            )}
          </SectionCard>
        </Col>
      </Row>

      {/* Occupancy forecast */}
      {hotelId && (
        <Row className="g-4 mb-4">
          <Col>
            <SectionCard
              title="Occupancy forecast — next 14 days"
              loading={loadingForecast}
            >
              {forecastFormatted.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={forecastFormatted}
                    margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                  >
                    <XAxis
                      dataKey="date"
                      tick={{ fill: MUTED, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval={1}
                    />
                    <YAxis
                      tick={{ fill: MUTED, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, forecastYAxisMax]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v) => [
                        `${Number(v).toFixed(1)}%`,
                        "Predicted occupancy",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke={TEAL}
                      strokeWidth={2}
                      dot={{ fill: TEAL, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: MUTED, fontSize: "0.85rem" }}>
                  Not enough occupancy history to forecast yet. The model needs
                  at least 7 days of data.
                </p>
              )}
            </SectionCard>
          </Col>
        </Row>
      )}

      {!hotelId && (
        <div
          style={{
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: "0.9rem 1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          <p style={{ color: MUTED, fontSize: "0.85rem", margin: 0 }}>
            Select a hotel above to see the 14-day occupancy forecast for that
            property.
          </p>
        </div>
      )}

      {/* Sentiment trend */}
      <Row className="g-4 mb-4">
        <Col md={6}>
          <SectionCard
            title="Review sentiment trend"
            loading={loadingSentiment}
          >
            {sentiment.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={sentiment}
                  margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                >
                  <XAxis
                    dataKey="month"
                    tick={{ fill: MUTED, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: MUTED, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[-1, 1]}
                    tickFormatter={(v) => v.toFixed(1)}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v) => [
                      Number(v).toFixed(3),
                      "Avg sentiment score",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgScore"
                    stroke={ACCENT}
                    strokeWidth={2}
                    dot={{ fill: ACCENT, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: MUTED, fontSize: "0.85rem" }}>
                No scored reviews yet — reviews are scored when submitted.
              </p>
            )}
          </SectionCard>
        </Col>

        <Col md={6}>
          <SectionCard title="Sentiment breakdown" loading={loadingSentiment}>
            {sentiment.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={sentiment}
                  margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                >
                  <XAxis
                    dataKey="month"
                    tick={{ fill: MUTED, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: MUTED, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar
                    dataKey="positiveCount"
                    name="Positive"
                    stackId="a"
                    fill={SUCCESS}
                  />
                  <Bar
                    dataKey="neutralCount"
                    name="Neutral"
                    stackId="a"
                    fill={MUTED}
                  />
                  <Bar
                    dataKey="negativeCount"
                    name="Negative"
                    stackId="a"
                    fill={DANGER}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: MUTED, fontSize: "0.85rem" }}>No data yet.</p>
            )}
          </SectionCard>
        </Col>
      </Row>

      {/* Guest segments table */}
      <SectionCard title="Guest segment table" loading={loadingSegments}>
        {segments.length === 0 ? (
          <p style={{ color: MUTED, fontSize: "0.85rem" }}>
            {loadingSegments
              ? ""
              : "No segments yet — analytics service may still be warming up."}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                color: "#F2F0EB",
              }}
            >
              <thead>
                <tr>
                  {[
                    "Guest",
                    "Email",
                    "Segment",
                    "Recency",
                    "Stays",
                    "Spend",
                    "R",
                    "F",
                    "M",
                  ].map((h) => (
                    <th key={h} style={thStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {segments.map((s) => (
                  <tr
                    key={s.guestId}
                    style={{ transition: "background 0.1s" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#232838")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 500 }}>
                        {s.firstName} {s.lastName}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: MUTED }}>{s.email}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          background: `${SEGMENT_COLORS[s.segment] ?? TEAL}22`,
                          color: SEGMENT_COLORS[s.segment] ?? TEAL,
                          fontWeight: 500,
                          fontSize: "0.75rem",
                          padding: "3px 10px",
                          borderRadius: 99,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.segment}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: MUTED }}>
                      {s.recencyDays}d ago
                    </td>
                    <td style={tdStyle}>{s.frequency}</td>
                    <td
                      style={{
                        ...tdStyle,
                        color: ACCENT,
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                      }}
                    >
                      €{Number(s.monetary).toLocaleString()}
                    </td>
                    <td
                      style={{ ...tdStyle, color: MUTED, textAlign: "center" }}
                    >
                      {s.rScore}
                    </td>
                    <td
                      style={{ ...tdStyle, color: MUTED, textAlign: "center" }}
                    >
                      {s.fScore}
                    </td>
                    <td
                      style={{ ...tdStyle, color: MUTED, textAlign: "center" }}
                    >
                      {s.mScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </Container>
  );
}
