import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Initializes Lenis once at the app root and feeds it into GSAP's own
 * ticker so every ScrollTrigger stays perfectly in sync with the
 * smoothed scroll position (rather than the raw native scroll event).
 *
 * lerp is intentionally mild (0.1) to keep scrolling smooth without
 * introducing noticeable drag.
 */
export default function useLenis() {
  useEffect(() => {
    // Respect reduced-motion preference — skip smoothing entirely.
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
      smoothWheel: true,
    });

    // Expose instance so route-level effects can force an immediate scroll reset.
    window.__overnightLenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    document.documentElement.classList.add("lenis");

    return () => {
      lenis.destroy();
      delete window.__overnightLenis;
      document.documentElement.classList.remove("lenis");
    };
  }, []);
}
