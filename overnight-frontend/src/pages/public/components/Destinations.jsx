import React, { useRef, useEffect } from "react";

export default function Destinations({
  countries,
  selectedCountry,
  selectCountry,
  DEST_IMAGES,
  FLAGS,
}) {
  const rowRef = useRef(null);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      // We only care about vertical wheel movement trying to scroll our row
      if (e.deltaY !== 0) {
        const maxScroll = el.scrollWidth - el.clientWidth;

        // Check if there is actual room left to scroll horizontally in either direction
        const canScrollLeft = el.scrollLeft > 1 && e.deltaY < 0;
        const canScrollRight = el.scrollLeft < maxScroll - 1 && e.deltaY > 0;

        if (canScrollLeft || canScrollRight) {
          // Manually apply the horizontal scroll step
          el.scrollLeft += e.deltaY;

          // Prevent default browser viewport scrolling
          e.preventDefault();

          // Prevent the event from bubbling up to GSAP / Smooth Scroll libraries on the window
          e.stopPropagation();
        }
      }
    };

    // Bind native event listener with passive
    el.addEventListener("wheel", handleWheel, { passive: false });

    // Clean up listener on component unmount
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <section id="destinations" className="destinations-section">
      <div className="container-on">
        <span className="section-eyebrow">Browse by Destination</span>
        <h2 className="section-title destinations-title">
          Eight Countries, One Collection
        </h2>

        <div className="destinations-row" ref={rowRef}>
          <button
            className={`dest-chip dest-chip--all${!selectedCountry ? " active" : ""}`}
            onClick={() => selectCountry(null)}
          >
            <span className="dest-chip__icon">🌍</span>
            All Properties
          </button>

          {countries.map((c) => (
            <button
              key={c}
              className={`dest-chip${selectedCountry === c ? " active" : ""}`}
              onClick={() => selectCountry(c)}
            >
              <img
                src={DEST_IMAGES[c] || FLAGS[c]}
                alt=""
                className="dest-chip__img"
                loading="lazy"
              />
              <div className="dest-chip__scrim" />
              <span className="dest-chip__label">
                <span>{FLAGS[c] ?? "🏳️"}</span>
                {c}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
