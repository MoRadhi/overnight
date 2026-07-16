import React from "react";
import HotelCard from "../../../components/HotelCard";

function SkeletonCard() {
  return (
    <div className="properties-skeleton-card">
      <div className="skeleton properties-skeleton-media" />
      <div className="properties-skeleton-body">
        <div className="skeleton properties-skeleton-line" />
        <div className="skeleton properties-skeleton-line--sm" />
        <div className="skeleton properties-skeleton-line--md" />
        <div className="skeleton properties-skeleton-line--xs" />
      </div>
    </div>
  );
}

export default function PropertiesGrid({
  propertiesRef,
  gridRef,
  hotels,
  loading,
}) {
  return (
    <section ref={propertiesRef} className="properties-section">
      <div className="container-on">
        <div className="properties-header">
          <div className="gold-rule gold-rule--left" />
        </div>

        <div ref={gridRef} className="properties-grid">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : hotels.length > 0 ? (
            hotels.map((h) => <HotelCard key={h.id} hotel={h} />)
          ) : (
            <div className="properties-empty-state">
              <div className="properties-empty-state__icon">🌙</div>
              <p className="properties-empty-state__title">No properties found</p>
              <p className="properties-empty-state__copy">
                Try selecting a different destination.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
