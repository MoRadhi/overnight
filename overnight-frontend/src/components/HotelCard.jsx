import { Link } from "react-router-dom";
import useTilt from "../hooks/useTilt";
import { getHotelImageUrl } from "../utils/hotelImages";

const COUNTRY_FLAGS = {
  France: "🇫🇷",
  Portugal: "🇵🇹",
  Japan: "🇯🇵",
  Spain: "🇪🇸",
  Norway: "🇳🇴",
  Italy: "🇮🇹",
  Morocco: "🇲🇦",
  India: "🇮🇳",
};

export default function HotelCard({ hotel }) {
  const { id, name, city, country, description } = hotel;
  const flag = COUNTRY_FLAGS[country] ?? "🌍";
  const tiltRef = useTilt({ max: 6 });
  const hotelImageUrl = getHotelImageUrl(hotel);

  return (
    <Link
      to={`/hotels/${id}`}
      className="hotel-card"
      ref={tiltRef}
      data-stagger
    >
      {/* Image */}
      <div className="hotel-card__img-wrap">
        <img
          src={hotelImageUrl}
          alt={name}
          className="hotel-card__img"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = getHotelImageUrl({
              ...hotel,
              imageUrl: "",
            });
          }}
        />
        <div className="hotel-card__img-overlay" />
        <span className="hotel-card__badge">
          {flag}&nbsp;&nbsp;{country}
        </span>
      </div>

      {/* Body */}
      <div className="hotel-card__body">
        <h3 className="hotel-card__name">{name}</h3>
        <p className="hotel-card__loc">
          <span className="hotel-card__loc-dot">◆</span>
          {city}, {country}
        </p>
        {description && <p className="hotel-card__desc">{description}</p>}

        <div className="hotel-card__foot">
          <div />
          <span className="hotel-card__cta">
            View Hotel
            <span className="hotel-card__arrow">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
