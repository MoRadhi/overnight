import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Attach to a section wrapper. Any descendant matching `selector`
 * (default: [data-reveal]) rises from translateY(100%) inside its own
 * overflow-hidden clip box as it enters the viewport. Use the
 * `.reveal-clip` / `.reveal-line` CSS pair for the markup:
 *
 *   <div className="reveal-clip"><h2 className="reveal-line" data-reveal>Title</h2></div>
 *
 * Returns a ref to attach to the section wrapper.
 */
export function useTextReveal(selector = "[data-reveal]") {
  const ref = useRef(null);

  useGSAP(
    () => {
      const els = ref.current?.querySelectorAll(selector);
      if (!els?.length) return;

      els.forEach((el, i) => {
        gsap.fromTo(
          el,
          { yPercent: 110, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            delay: (i % 6) * 0.06,
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          },
        );
      });
    },
    { scope: ref },
  );

  return ref;
}

/**
 * Staggered "rise + fade" entrance for a grid of cards. Attach the
 * returned ref to the grid container; pass a selector for the cards.
 */
export function useStaggerReveal(selector = "[data-stagger]", stagger = 0.09) {
  const ref = useRef(null);

  useGSAP(
    () => {
      const els = ref.current?.querySelectorAll(selector);
      if (!els?.length) return;

      gsap.fromTo(
        els,
        { y: 48, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          stagger,
          scrollTrigger: {
            trigger: ref.current,
            start: "top 82%",
            toggleActions: "play none none none",
          },
        },
      );
    },
    { scope: ref },
  );

  return ref;
}

export { gsap, ScrollTrigger };
