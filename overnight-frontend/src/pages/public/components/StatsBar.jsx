import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function StatsBar({ stats }) {
  const containerRef = useRef(null);
  const numsRef = useRef([]);

  useEffect(() => {
    if (!containerRef.current) return;
    let played = false;

    const run = () => {
      if (played) return;
      played = true;
      const els = gsap.utils.toArray("[data-target]", containerRef.current);
      els.forEach((el) => {
        const raw = el.dataset.target ?? "";
        const m = String(raw).match(/^(\d+)(.*)$/);
        if (!m) {
          el.textContent = raw;
          return;
        }
        const target = parseInt(m[1], 10) || 0;
        const suffix = m[2] || "";
        try {
          gsap.to(
              { val: 0 },
              {
                val: target,
                duration: 1.8,
                ease: "power1.out",
                onUpdate() {
                  el.textContent = `${Math.round(this.targets()[0].val)}${suffix}`;
                },
              },
            );
        } catch {
          // fallback numeric tween if GSAP fails
          const start = 0;
          const duration = 1200;
          const started = performance.now();
          const step = (now) => {
            const t = Math.min(1, (now - started) / duration);
            const eased = t < 1 ? 1 - Math.pow(1 - t, 3) : 1;
            const val = Math.round(start + (target - start) * eased);
            el.textContent = `${val}${suffix}`;
            if (t < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      });
    };

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) run();
        });
      },
      { threshold: 0.18 },
    );

    // if already visible, run immediately
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.top >= 0 && rect.top < window.innerHeight) run();

    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [stats]);

  return (
    <div className="stats-bar">
      <div className="container-on" style={{ padding: "1.75rem 2rem" }}>
        <div
          className="stats-grid"
          ref={containerRef}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: "1rem",
          }}
        >
          {stats.map(({ n, label }, idx) => {
            const raw = n;
            const m = String(raw).match(/^(\d+)(.*)$/);
            const suffix = m ? m[2] || "" : "";
            const initial = m ? `0${suffix}` : raw;
            return (
              <div
                key={label}
                data-stagger
                className="stat-item"
                style={{ textAlign: "center" }}
              >
                <div
                  className="stat-value"
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "clamp(1.6rem,3vw,2.4rem)",
                    color: "var(--gold-light)",
                    lineHeight: 1,
                  }}
                >
                  <span
                    data-target={raw}
                    ref={(el) => (numsRef.current[idx] = el)}
                  >
                    {initial}
                  </span>
                </div>
                <div
                  className="stat-label"
                  style={{
                    fontSize: "0.7rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginTop: "0.35rem",
                  }}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
