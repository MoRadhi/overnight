import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { fetchHotel, fetchRoomTypes } from "../../api/hotels";
import { checkAvailability } from "../../api/rooms";
import { createReservation } from "../../api/reservations";

/**
 * Booking flow — matches actual backend contracts:
 *
 * 1. GET  /api/rooms/availability?hotelId=X&checkIn=Y&checkOut=Z
 *    → all available rooms for that hotel + date range (AvailabilityService)
 *
 * 2. Filter client-side by roomTypeId to find a specific room
 *
 * 3. POST /api/reservations
 *    ReservationRequest: { firstName, lastName, email, phone?,
 *                          roomId, checkInDate, checkOutDate }
 *    Backend does find-or-create guest by email internally.
 */
export default function BookingForm() {
  const { id: hotelId } = useParams();
  const [searchParams] = useSearchParams();

  const roomTypeId = searchParams.get("roomTypeId");
  const initCheckIn = searchParams.get("checkIn") || "";
  const initCheckOut = searchParams.get("checkOut") || "";

  const [hotel, setHotel] = useState(null);
  const [roomType, setRoomType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const scrollToTopNow = () => {
      const lenis = window.__overnightLenis;
      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(0, { immediate: true, force: true });
      }

      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    scrollToTopNow();
    const raf = requestAnimationFrame(scrollToTopNow);
    const timer = setTimeout(scrollToTopNow, 80);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [hotelId, roomTypeId]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    checkIn: initCheckIn,
    checkOut: initCheckOut,
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Load hotel + matching room type
  useEffect(() => {
    if (!roomTypeId) {
      setLoading(false);
      return;
    }
    Promise.all([fetchHotel(hotelId), fetchRoomTypes(hotelId)])
      .then(([h, rts]) => {
        setHotel(h);
        setRoomType(
          rts.find((r) => String(r.id) === String(roomTypeId)) ?? null,
        );
      })
      .catch(() => setError("Could not load property details."))
      .finally(() => setLoading(false));
  }, [hotelId, roomTypeId]);

  // Derived
  const nights =
    form.checkIn && form.checkOut
      ? Math.round(
          (new Date(form.checkOut) - new Date(form.checkIn)) / 86400000,
        )
      : 0;
  const totalPrice =
    roomType && nights > 0
      ? (Number(roomType.basePrice) * nights).toFixed(2)
      : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (nights <= 0) {
      setError("Check-out must be after check-in.");
      return;
    }
    if (!roomTypeId) {
      setError("No room type selected. Please go back and choose a room.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Get all available rooms for this hotel + dates
      const availableRooms = await checkAvailability(
        Number(hotelId),
        form.checkIn,
        form.checkOut,
      );

      // 2. Find one room of the chosen type
      const room = (availableRooms ?? []).find(
        (r) => String(r.roomTypeId) === String(roomTypeId),
      );

      if (!room) {
        setError(
          "No rooms of this type are available for those dates. " +
            "Please try different dates or select another room type.",
        );
        setSubmitting(false);
        return;
      }

      // 3. POST reservation — ReservationRequest carries guest fields inline;
      //    Spring Boot deserialises checkInDate / checkOutDate as LocalDate.
      await createReservation({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        roomId: room.id,
        checkInDate: form.checkIn,
        checkOutDate: form.checkOut,
      });

      setSuccess(true);
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data ??
        "Something went wrong. Please try again.";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success ──────────────────────────────────────────────────────
  if (success) {
    return (
      <div
        style={{
          background: "var(--space-void)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <motion.div
          key={`booking-success-${hotelId}-${roomTypeId ?? "none"}`}
          className="glass"
          style={{
            maxWidth: 520,
            width: "100%",
            padding: "3rem",
            textAlign: "center",
          }}
          initial={{ opacity: 0, y: 18, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              margin: "0 auto 2rem",
              background:
                "radial-gradient(circle, rgba(0,245,212,0.25) 0%, rgba(139,92,246,0.15) 60%, transparent 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
            }}
          >
            ✦
          </div>
          <h2
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "1.9rem",
              marginBottom: "0.75rem",
            }}
          >
            Reservation Confirmed
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              lineHeight: 1.7,
              marginBottom: "2rem",
            }}
          >
            Welcome, {form.firstName}. Your stay at{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {hotel?.name}
            </strong>{" "}
            from{" "}
            <strong style={{ color: "var(--gold-light)" }}>
              {form.checkIn}
            </strong>{" "}
            to{" "}
            <strong style={{ color: "var(--gold-light)" }}>
              {form.checkOut}
            </strong>{" "}
            is confirmed. A summary will be sent to {form.email}.
          </p>
          <div className="gold-rule" />
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link to={`/hotels/${hotelId}`} className="btn-ghost">
              ← Back to Hotel
            </Link>
            <Link to="/" className="btn-gold">
              Explore More
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          background: "var(--space-void)",
          minHeight: "100vh",
          paddingTop: 100,
        }}
      >
        <motion.div
          key={`booking-loading-${hotelId}-${roomTypeId ?? "none"}`}
          className="container-on"
          style={{ maxWidth: 760 }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="skeleton"
            style={{ height: 32, width: "50%", marginBottom: 16 }}
          />
          <div
            className="skeleton"
            style={{ height: 18, width: "30%", marginBottom: 40 }}
          />
          <div className="skeleton" style={{ height: 420, borderRadius: 20 }} />
        </motion.div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: "var(--space-void)",
        minHeight: "100vh",
        paddingTop: 100,
        paddingBottom: "5rem",
      }}
    >
      <motion.div
        key={`booking-form-${hotelId}-${roomTypeId ?? "none"}`}
        className="container-on"
        style={{ maxWidth: 820 }}
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.58, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Breadcrumb */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            marginBottom: "2.5rem",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
          }}
        >
          <Link
            to="/"
            style={{ color: "var(--text-muted)", transition: "color 0.2s" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--gold-light)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")
            }
          >
            Home
          </Link>
          <span>›</span>
          <Link
            to={`/hotels/${hotelId}`}
            style={{ color: "var(--text-muted)", transition: "color 0.2s" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--gold-light)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")
            }
          >
            {hotel?.name ?? "Hotel"}
          </Link>
          <span>›</span>
          <span style={{ color: "var(--text-secondary)" }}>Reserve</span>
        </div>

        {/* Title */}
        <span className="section-eyebrow">Complete Your Reservation</span>
        <h1
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
            marginBottom: "0.5rem",
          }}
        >
          {hotel?.name}
        </h1>
        {roomType && (
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              marginBottom: "2.5rem",
            }}
          >
            {roomType.name} · {hotel?.city}, {hotel?.country}
          </p>
        )}
        <div
          className="gold-rule gold-rule--left"
          style={{ marginBottom: "2.5rem" }}
        />

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: "2rem",
            alignItems: "start",
          }}
        >
          {/* ── Left: guest details + dates ── */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            {/* Guest details */}
            <div className="glass" style={{ padding: "2rem" }}>
              <p
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "1.1rem",
                  marginBottom: "1.5rem",
                }}
              >
                Guest Details
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <label className="on-label">First Name *</label>
                  <input
                    className="on-input"
                    required
                    placeholder="Alice"
                    value={form.firstName}
                    onChange={set("firstName")}
                  />
                </div>
                <div>
                  <label className="on-label">Last Name *</label>
                  <input
                    className="on-input"
                    required
                    placeholder="Moreau"
                    value={form.lastName}
                    onChange={set("lastName")}
                  />
                </div>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label className="on-label">Email Address *</label>
                <input
                  className="on-input"
                  type="email"
                  required
                  placeholder="alice@example.com"
                  value={form.email}
                  onChange={set("email")}
                />
              </div>
              <div>
                <label className="on-label">Phone Number</label>
                <input
                  className="on-input"
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  value={form.phone}
                  onChange={set("phone")}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="glass" style={{ padding: "2rem" }}>
              <p
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "1.1rem",
                  marginBottom: "1.5rem",
                }}
              >
                Your Dates
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label className="on-label">Check-in *</label>
                  <input
                    className="on-input"
                    type="date"
                    required
                    min={today}
                    value={form.checkIn}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((f) => ({
                        ...f,
                        checkIn: val,
                        checkOut:
                          f.checkOut && val >= f.checkOut ? "" : f.checkOut,
                      }));
                    }}
                  />
                </div>
                <div>
                  <label className="on-label">Check-out *</label>
                  <input
                    className="on-input"
                    type="date"
                    required
                    min={form.checkIn || today}
                    value={form.checkOut}
                    onChange={set("checkOut")}
                  />
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  background: "rgba(190,48,48,0.12)",
                  border: "1px solid rgba(190,48,48,0.3)",
                  borderRadius: 10,
                  padding: "1rem",
                  color: "#f87171",
                  fontSize: "0.85rem",
                  lineHeight: 1.6,
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* ── Right: price summary ── */}
          <div className="booking-card">
            <p className="booking-card__title">Price Summary</p>

            {roomType && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "1rem",
                  paddingBottom: "1rem",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-primary)",
                      marginBottom: "0.2rem",
                    }}
                  >
                    {roomType.name}
                  </p>
                  <p
                    style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}
                  >
                    Up to {roomType.capacity} guest
                    {roomType.capacity !== 1 ? "s" : ""}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "0.88rem",
                    color: "var(--gold-light)",
                    whiteSpace: "nowrap",
                  }}
                >
                  ${Number(roomType.basePrice).toLocaleString()}/night
                </span>
              </div>
            )}

            {nights > 0 && roomType ? (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.6rem",
                    fontSize: "0.83rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>
                    ${Number(roomType.basePrice).toLocaleString()} × {nights}{" "}
                    night{nights !== 1 ? "s" : ""}
                  </span>
                  <span>${Number(totalPrice).toLocaleString()}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "1rem",
                    marginTop: "0.5rem",
                    marginBottom: "1.5rem",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: "1rem",
                    }}
                  >
                    Total
                  </span>
                  <span
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: "1.25rem",
                      color: "var(--gold-light)",
                    }}
                  >
                    ${Number(totalPrice).toLocaleString()}
                  </span>
                </div>
              </>
            ) : (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginBottom: "1.5rem",
                  lineHeight: 1.6,
                }}
              >
                Select check-in and check-out dates to see the total.
              </p>
            )}

            <button
              type="submit"
              className="btn-gold"
              disabled={submitting}
              style={{
                width: "100%",
                justifyContent: "center",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Confirming…" : "Confirm Reservation"}
            </button>

            <p
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                textAlign: "center",
                marginTop: "0.75rem",
                lineHeight: 1.6,
              }}
            >
              Free cancellation up to 48 hours before check-in. No payment taken
              now.
            </p>

            {/* Perks */}
            <div
              style={{
                marginTop: "1.75rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p
                style={{
                  fontSize: "0.62rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: "0.9rem",
                }}
              >
                Included with every stay
              </p>
              {[
                "Complimentary breakfast",
                "Free cancellation 48h before",
                "Best rate guarantee",
                "24/7 concierge service",
              ].map((text) => (
                <div
                  key={text}
                  style={{
                    display: "flex",
                    gap: "0.6rem",
                    marginBottom: "0.55rem",
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span
                    style={{
                      color: "var(--gold)",
                      flexShrink: 0,
                      fontSize: "0.6rem",
                      marginTop: "0.2rem",
                    }}
                  >
                    ✦
                  </span>
                  {text}
                </div>
              ))}
            </div>
          </div>
        </form>

        <style>{`
          @media (max-width: 768px) {
            form[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
            .booking-card { position: static !important; }
          }
          @media (max-width: 540px) {
            div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </motion.div>
    </div>
  );
}
