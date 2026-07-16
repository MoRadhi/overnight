import React from "react";

export default function TestimonialsSection({ testimonials, innerRef }) {
  return (
    <section className="testimonials-section" ref={innerRef}>
      <div className="testimonials-bg">
        <img src="/images/dest-ny.jpg" alt="" loading="lazy" />
      </div>
      <div className="container-on testimonials-head">
        <div className="reveal-clip">
          <span className="reveal-line section-eyebrow" data-reveal>
            In Their Words
          </span>
        </div>
        <div className="reveal-clip">
          <h2 className="reveal-line section-title" data-reveal>
            Guests Who Keep Returning
          </h2>
        </div>
        <div className="gold-rule" />
      </div>
      <div className="container-on testimonials-grid">
        {testimonials.map((t) => (
          <div key={t.name} className="testimonial-card" data-reveal>
            <div className="testimonial-card__img">
              <img src={t.img} alt="" loading="lazy" />
            </div>
            <div className="testimonial-card__stars">★★★★★</div>
            <p className="testimonial-card__quote">“{t.quote}”</p>
            <div className="testimonial-card__foot">
              <div className="testimonial-card__avatar">{t.initials}</div>
              <div>
                <div className="testimonial-card__name">{t.name}</div>
                <div className="testimonial-card__meta">{t.location}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
