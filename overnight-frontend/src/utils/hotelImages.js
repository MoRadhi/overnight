const HOTEL_IMAGE_MATCHERS = [
  {
    test: (text) => /hotel\s*noir|ritz|paris|france/.test(text),
    src: "https://images.unsplash.com/photo-1684485442894-8516e58643b1?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    test: (text) => /the\s*verdant|kyoto|japan/.test(text),
    src: "https://images.unsplash.com/photo-1540541338537-41369657c890?auto=format&fit=crop&w=1600&q=80",
  },
  {
    test: (text) => /sea\s*cliff\s*retreat|lisbon|portugal/.test(text),
    src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80",
  },
  {
    test: (text) => /casa\s*dorada|barcelona|spain/.test(text),
    src: "https://images.unsplash.com/photo-1513519245088-0e12902e35ca?auto=format&fit=crop&w=1600&q=80",
  },
  {
    test: (text) => /fjord\s*house|bergen|norway/.test(text),
    src: "https://images.unsplash.com/photo-1605152276897-4f618f831968?auto=format&fit=crop&w=1600&q=80",
  },
  {
    test: (text) => /villa\s*lumina|rome|italy/.test(text),
    src: "/images/hotel-tuscany-villa.jpg",
  },
  {
    test: (text) => /riad\s*azul|marrakech|morocco/.test(text),
    src: "/images/dest-marrakech.jpg",
  },
  {
    test: (text) => /the\s*banyan|mumbai|india/.test(text),
    src: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1600&q=80",
  },
];

const COUNTRY_FALLBACKS = {
  france: "/images/dest-paris.jpg",
  portugal:
    "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1600&q=80",
  japan: "/images/dest-tokyo.jpg",
  spain:
    "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1600&q=80",
  norway: "../../public/images/Norway.jpg",
  italy: "/images/hotel-tuscany-villa.jpg",
  morocco: "/images/dest-marrakech.jpg",
  india:
    "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1600&q=80",
};

const LOCAL_FALLBACKS = [
  "/images/hotel-ritz-paris.jpg",
  "/images/hotel-aman-tokyo.jpg",
  "/images/hotel-bali-retreat.jpg",
  "/images/hotel-tuscany-villa.jpg",
  "/images/hotel-california-desert.jpg",
  "/images/hotel-southern-ocean.jpg",
  "/images/booking-hotel-lobby.jpg",
];

const PLACEHOLDER_HOSTS = [
  "source.unsplash.com",
  "picsum.photos",
  "placehold.co",
  "via.placeholder.com",
];

function normalizeText(value) {
  return String(value ?? "").toLowerCase();
}

function isPlaceholderImage(url) {
  return PLACEHOLDER_HOSTS.some((host) => url.includes(host));
}

function pickFallback(key) {
  const text = normalizeText(key);
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }

  return LOCAL_FALLBACKS[hash % LOCAL_FALLBACKS.length];
}

function getCountryFallback(country) {
  return COUNTRY_FALLBACKS[normalizeText(country)] || null;
}

export function getHotelImageUrl(hotel) {
  const searchText = normalizeText(
    [hotel?.name, hotel?.city, hotel?.country].filter(Boolean).join(" "),
  );

  const imageUrl = hotel?.imageUrl?.trim();
  if (imageUrl && !isPlaceholderImage(imageUrl)) {
    return imageUrl;
  }

  const matchedImage = HOTEL_IMAGE_MATCHERS.find(({ test }) =>
    test(searchText),
  );
  if (matchedImage) {
    return matchedImage.src;
  }

  const countryFallback = getCountryFallback(hotel?.country);
  if (countryFallback) {
    return countryFallback;
  }

  return pickFallback(searchText || hotel?.id || hotel?.country || hotel?.name);
}
