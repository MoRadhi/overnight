import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { fetchHotel, fetchRoomTypes } from "../../api/hotels";
import RoomTypeCard from "../../components/RoomTypeCard";
import { getHotelImageUrl } from "../../utils/hotelImages";

const FLAGS = {
  France: "🇫🇷",
  Portugal: "🇵🇹",
  Japan: "🇯🇵",
  Spain: "🇪🇸",
  Norway: "🇳🇴",
  Italy: "🇮🇹",
  Morocco: "🇲🇦",
  India: "🇮🇳",
};

// Module-level (not component state) so it survives this component unmounting
// on route change - revisiting a property (browse -> back -> same hotel) reuses
// the cached data instead of re-fetching. Resets on a full page reload.
const detailCache = new Map();

export default function HotelDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const [hotel, setHotel] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dates — prefill from URL if coming from hero search
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const scrollToTopNow = () => {
      const lenis = window.__overnightLenis;
      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(0, { immediate: true, force: true });
      }

      // Fallbacks for browsers/router timing edge cases.
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    // Run across first frames to override any late restore.
    scrollToTopNow();
    const raf = requestAnimationFrame(scrollToTopNow);
    const timer = setTimeout(scrollToTopNow, 80);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [id]);

  useEffect(() => {
    const cached = detailCache.get(id);
    if (cached) {
      setHotel(cached.hotel);
      setRoomTypes(cached.roomTypes);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([fetchHotel(id), fetchRoomTypes(id)])
      .then(([h, rt]) => {
        detailCache.set(id, { hotel: h, roomTypes: rt });
        setHotel(h);
        setRoomTypes(rt);
      })
      .catch(() =>
        setError("We could not load this property. Please try again."),
      )
      .finally(() => setLoading(false));
  }, [id]);

  /* ── Loading ────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div
        style={{
          background: "var(--space-void)",
          minHeight: "100vh",
          paddingTop: 80,
        }}
      >
        <div className="skeleton" style={{ height: "58vh" }} />
        <div className="container-on" style={{ padding: "3rem 2rem" }}>
          <div
            className="skeleton"
            style={{ height: 40, width: "45%", marginBottom: 12 }}
          />
          <div
            className="skeleton"
            style={{ height: 18, width: "25%", marginBottom: 32 }}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
              gap: "1.5rem",
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 360, borderRadius: 16 }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ──────────────────────────────────────────────────── */
  if (error || !hotel) {
    return (
      <div
        style={{
          background: "var(--space-void)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          paddingTop: 80,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2.5rem" }}>🌙</div>
        <p
          style={{ fontFamily: "Playfair Display, serif", fontSize: "1.4rem" }}
        >
          Property unavailable
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
          {error}
        </p>
        <Link to="/" className="btn-gold" style={{ marginTop: "0.5rem" }}>
          ← Back to all properties
        </Link>
      </div>
    );
  }

  const flag = FLAGS[hotel.country] ?? "🌍";
  const hotelImageUrl = getHotelImageUrl(hotel);

  return (
    <div style={{ background: "var(--space-void)", minHeight: "100vh" }}>
      {/* ── Hero image ────────────────────────────────────────── */}
      <motion.div
        key={`detail-hero-${id}`}
        className="detail-hero"
        initial={{ opacity: 0, y: 16, scale: 1.01 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        <img
          src={hotelImageUrl}
          alt={hotel.name}
          className="detail-hero__img"
          onError={(e) => {
            e.currentTarget.src = getHotelImageUrl({
              ...hotel,
              imageUrl: "",
            });
          }}
        />
        <div className="detail-hero__overlay" />
        <div className="detail-hero__content">
          <div className="detail-hero__country">
            <span>{flag}</span>
            <span>
              {hotel.city}, {hotel.country}
            </span>
          </div>
          <h1 className="detail-hero__title">{hotel.name}</h1>
          <p className="detail-hero__loc">{hotel.address}</p>
        </div>
      </motion.div>

      {/* ── Body ──────────────────────────────────────────────── */}
      <motion.div
        key={`detail-body-${id}`}
        className="container-on"
        style={{ paddingTop: "3.5rem", paddingBottom: "5rem" }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: "3.5rem",
            alignItems: "start",
          }}
        >
          {/* Left: description + room types */}
          <div>
            {/* Back link */}
            <Link
              to="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "2rem",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--gold-light)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-muted)")
              }
            >
              ← All Properties
            </Link>

            {/* Description */}
            {hotel.description && (
              <div style={{ marginBottom: "3.5rem" }}>
                <span className="section-eyebrow">About This Property</span>
                <div className="gold-rule gold-rule--left" />
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "1rem",
                    lineHeight: 1.8,
                    maxWidth: 640,
                  }}
                >
                  {hotel.description}
                </p>
              </div>
            )}

            {/* Room types */}
            <div>
              <span className="section-eyebrow">Room & Suite Selection</span>
              <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>
                Choose Your Room
              </h2>
              <div
                className="gold-rule gold-rule--left"
                style={{ marginBottom: "2rem" }}
              />

              {roomTypes.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  No rooms available at this time.
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  {roomTypes.map((rt) => (
                    <RoomTypeCard
                      key={rt.id}
                      roomType={rt}
                      hotelId={id}
                      checkIn={checkIn}
                      checkOut={checkOut}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: sticky date + booking card */}
          <div>
            <div className="booking-card">
              <p className="booking-card__title">Plan Your Stay</p>

              {/* Check-in */}
              <div style={{ marginBottom: "1rem" }}>
                <label className="on-label">Check-in</label>
                <input
                  type="date"
                  className="on-input"
                  min={today}
                  value={checkIn}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    if (checkOut && e.target.value >= checkOut) setCheckOut("");
                  }}
                />
              </div>

              {/* Check-out */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label className="on-label">Check-out</label>
                <input
                  type="date"
                  className="on-input"
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>

              {/* Night count */}
              {checkIn &&
                checkOut &&
                (() => {
                  const nights = Math.round(
                    (new Date(checkOut) - new Date(checkIn)) / 86400000,
                  );
                  return nights > 0 ? (
                    <div
                      style={{
                        background: "rgba(201,168,76,0.06)",
                        border: "1px solid rgba(201,168,76,0.15)",
                        borderRadius: 10,
                        padding: "0.85rem 1rem",
                        marginBottom: "1.5rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Duration
                      </span>
                      <span
                        style={{
                          fontFamily: "Playfair Display, serif",
                          color: "var(--gold-light)",
                          fontSize: "1.05rem",
                        }}
                      >
                        {nights} night{nights !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ) : null;
                })()}

              <p
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.65,
                }}
              >
                Select dates then choose a room from the list to complete your
                reservation.
              </p>

              {/* Amenities */}
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
                  ["✦", "Complimentary breakfast"],
                  ["✦", "Free cancellation 48h before"],
                  ["✦", "Best rate guarantee"],
                  ["✦", "24/7 concierge service"],
                ].map(([icon, text]) => (
                  <div
                    key={text}
                    style={{
                      display: "flex",
                      gap: "0.6rem",
                      alignItems: "flex-start",
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
                        marginTop: "0.22rem",
                      }}
                    >
                      {icon}
                    </span>
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Responsive two-col → single col */}
      <style>{`
        @media (max-width: 900px) {
          .container-on > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
