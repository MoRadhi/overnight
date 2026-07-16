import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Subtle 3D tilt-on-hover for cards. Max rotation is intentionally
 * small (7deg) — enough to read as "physical", not a gimmick.
 * Skipped entirely on touch devices (no meaningful pointer position).
 */
export default function useTilt({ max = 7 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    const rotateX = gsap.quickTo(el, "rotationX", {
      duration: 0.5,
      ease: "power3.out",
    });
    const rotateY = gsap.quickTo(el, "rotationY", {
      duration: 0.5,
      ease: "power3.out",
    });
    const translateZ = gsap.quickTo(el, "z", {
      duration: 0.5,
      ease: "power3.out",
    });

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      rotateX(-py * max);
      rotateY(px * max);
      translateZ(12);
    };
    const onLeave = () => {
      rotateX(0);
      rotateY(0);
      translateZ(0);
    };

    el.style.transformPerspective = "800px";
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);

    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [max]);

  return ref;
}
