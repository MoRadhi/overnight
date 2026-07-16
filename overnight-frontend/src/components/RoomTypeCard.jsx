import { useNavigate } from "react-router-dom";

const FALLBACK =
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80";

export default function RoomTypeCard({ roomType, hotelId, checkIn, checkOut }) {
  const { id, name, description, basePrice, capacity, imageUrl } = roomType;
  const navigate = useNavigate();

  const handleBook = () => {
    const params = new URLSearchParams({ roomTypeId: id });
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    navigate(`/hotels/${hotelId}/book?${params.toString()}`);
  };

  return (
    <div className="room-card">
      {/* Image */}
      <div className="room-card__img-wrap">
        <img
          src={imageUrl || FALLBACK}
          alt={name}
          className="room-card__img"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = FALLBACK;
          }}
        />
        <div className="room-card__overlay" />
        <span className="room-card__cap">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          {capacity} {capacity === 1 ? "guest" : "guests"}
        </span>
      </div>

      {/* Body */}
      <div className="room-card__body">
        <h4 className="room-card__name">{name}</h4>
        {description && <p className="room-card__desc">{description}</p>}

        <div className="room-card__foot">
          <div>
            <div className="room-card__price-label">From</div>
            <div className="room-card__price-val">
              ${Number(basePrice).toLocaleString()}
              <span className="room-card__price-night"> / night</span>
            </div>
          </div>
          <button className="btn-gold" onClick={handleBook}>
            Reserve
          </button>
        </div>
      </div>
    </div>
  );
}
