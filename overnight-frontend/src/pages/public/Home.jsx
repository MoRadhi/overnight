import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Hero from "./components/Hero";
import { fetchHotels, fetchCountries } from "../../api/hotels";
import { useTextReveal, useStaggerReveal } from "../../hooks/useReveal";
import StatsBar from "./components/StatsBar";
import Pillars from "./components/Pillars";
import Destinations from "./components/Destinations";
import PropertiesGrid from "./components/PropertiesGrid";
import DiningSection from "./components/DiningSection";
import TestimonialsSection from "./components/TestimonialsSection";
import TaglineBanner from "./components/TaglineBanner";

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

const DEST_IMAGES = {
  France:
    "https://images.unsplash.com/photo-1684485442894-8516e58643b1?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  Japan: "/images/dest-tokyo.jpg",
  Morocco: "/images/dest-marrakech.jpg",
  Italy: "/images/hotel-tuscany-villa.jpg",
  Portugal:
    "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=80",
  Spain:
    "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80",
  Norway:
    "https://images.unsplash.com/photo-1475066392170-59d55d96fe51?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  India:
    "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80",
};

const TESTIMONIALS = [
  {
    name: "Alice Moreau",
    initials: "AM",
    location: "Champions guest · 6 stays",
    quote:
      "Every property somehow feels hand-picked for the way I actually travel. I stopped checking other sites two years ago.",
    img: "/images/hotel-ritz-paris.jpg",
  },
  {
    name: "Uma Krishnamurthy",
    initials: "UK",
    location: "Champions guest · 5 stays",
    quote:
      "The Bali retreat still comes up in conversation a year later. Quiet, precise service, nothing was ever asked twice.",
    img: "/images/hotel-bali-retreat.jpg",
  },
  {
    name: "Kenji Watanabe",
    initials: "KW",
    location: "Potential Loyalist · 2 stays",
    quote:
      "Booked in under a minute, upgraded on arrival without asking. Overnight is now the only place I check first.",
    img: "/images/hotel-aman-tokyo.jpg",
  },
];

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hotels, setHotels] = useState([]);
  const [allHotels, setAllHotels] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  const propertiesRef = useRef(null);

  const selectedCountry = searchParams.get("country") || null;

  useEffect(() => {
    fetchCountries()
      .then(setCountries)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchHotels()
      .then(setAllHotels)
      .catch(() => setAllHotels([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchHotels(selectedCountry)
      .then(setHotels)
      .catch(() => setHotels([]))
      .finally(() => setLoading(false));
  }, [selectedCountry]);

  const selectCountry = useCallback(
    (c) => {
      setSearchParams(c ? { country: c } : {});
      setTimeout(
        () =>
          propertiesRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        60,
      );
    },
    [setSearchParams],
  );

  const pillarsRef = useStaggerReveal("[data-stagger]");
  const gridRef = useStaggerReveal("[data-stagger]");
  const diningRef = useTextReveal();
  const testimonialsRef = useTextReveal();

  const roomTypeTotal = allHotels.reduce(
    (sum, h) => sum + (Number(h.roomTypeCount) || 0),
    0,
  );

  const STATS = [
    { n: countries.length || "8", label: "Countries" },
    { n: allHotels.length || "24", label: "Properties" },
    { n: roomTypeTotal || "72", label: "Room Types" },
    { n: "24/7", label: "Concierge" },
  ];

  const PILLARS = [
    {
      icon: "✦",
      title: "Editorially Curated",
      body: "Every property is hand-selected for architecture, location, and experience, never aggregated.",
    },
    {
      icon: "◈",
      title: "Instant Confirmation",
      body: "Real-time availability and booking in under 60 seconds, with free cancellation up to 48 hours before.",
    },
    {
      icon: "◉",
      title: "Guest Intelligence",
      body: "Our analytics engine recognises returning guests and continuously raises the bar on personalised service.",
    },
  ];

  return (
    <>
      <Hero propertiesRef={propertiesRef} />

      <StatsBar stats={STATS} />

      <Pillars pillars={PILLARS} innerRef={pillarsRef} />

      <Destinations
        countries={countries}
        selectedCountry={selectedCountry}
        selectCountry={selectCountry}
        DEST_IMAGES={DEST_IMAGES}
        FLAGS={FLAGS}
      />

      <PropertiesGrid
        propertiesRef={propertiesRef}
        gridRef={gridRef}
        hotels={hotels}
        loading={loading}
      />

      <DiningSection innerRef={diningRef} />

      <TestimonialsSection
        testimonials={TESTIMONIALS}
        innerRef={testimonialsRef}
      />

      <TaglineBanner />
    </>
  );
}
