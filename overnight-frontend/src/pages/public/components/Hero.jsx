import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { motion } from "framer-motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Hero({ propertiesRef }) {
  const heroStageRef = useRef(null);
  const fgRef = useRef(null);

  // Split COLLECTION into individual characters to stagger them
  const collectionLetters = "COLLECTION".split("");

  // Entrance animation for OVERNIGHT
  const overnightVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
    }
  };

  // Framer Motion Variants for COLLECTION (Staggered 3D Masked Reveal)
  const collectionContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.3, // Starts right as OVERNIGHT settles
      }
    }
  };

  const letterAnimation = {
    hidden: { y: "110%", opacity: 0, rotateX: -65 },
    visible: {
      y: 0,
      opacity: 1,
      rotateX: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] // Premium ultra-smooth bezier curve
      }
    }
  };

  useGSAP(
    () => {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      // Resting pose: ensure foreground starts hidden and slides up.
      gsap.set(fgRef.current, { opacity: 0, y: 24 });

      if (prefersReduced) {
        gsap.set(fgRef.current, { opacity: 1, y: 0 });
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroStageRef.current,
          start: "top top",
          end: "+=130%",
          scrub: 0.7,
          pin: true,
          anticipatePin: 1,
        },
      });

      tl.to(
        fgRef.current,
        { opacity: 1, y: 0, ease: "power1.out", duration: 0.5 },
        0,
      );

      // Entrance polish on first paint for the CTA button wrapper
      gsap.fromTo(
        ".hero-fg__btn-wrap",
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          delay: 0.2,
        },
      );
    },
    { scope: heroStageRef },
  );

  return (
    <section className="hero-stage" ref={heroStageRef}>
      <div className="hero-bg-type" aria-hidden="true" style={{ perspective: "1000px" }}>
        
        {/* OVERNIGHT */}
        <motion.span
          variants={overnightVariants}
          initial="hidden"
          animate="visible"
          style={{ display: "inline-block" }}
        >
          <motion.span 
            className="hero-bg-type__line"
            style={{
              backgroundImage: "linear-gradient(120deg, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.2) 75%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              display: "inline-block",
            }}
            animate={{
              backgroundPosition: ["200% 0", "-200% 0"]
            }}
            transition={{
              repeat: Infinity,
              repeatType: "loop",
              duration: 4,
              ease: "linear"
            }}
          >
            OVERNIGHT
          </motion.span>
        </motion.span>

        {/* COLLECTION */}
        <motion.span 
          className="hero-bg-type__line hero-bg-type__line--fill hero-bg-type__line--anim"
          variants={collectionContainer}
          initial="hidden"
          animate="visible"
          style={{ 
            display: "inline-flex", 
            justifyContent: "center",
            overflow: "hidden"
          }}
        >
          {collectionLetters.map((char, index) => (
            <span 
              key={index} 
              style={{ 
                display: "inline-block", 
                overflow: "hidden",
                marginRight: index < collectionLetters.length - 1 ? "0.02em" : "0"
              }}
            >
              <motion.span
                variants={letterAnimation}
                style={{ 
                  display: "inline-block", 
                  transformOrigin: "bottom center"
                }}
              >
                {char}
              </motion.span>
            </span>
          ))}
        </motion.span>
      </div>

      {/* Clean Foreground Container carrying only the polished CTA */}
      <div className="hero-fg" ref={fgRef} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div className="hero-fg__btn-wrap">
          <motion.button
            className="btn-primary"
            onClick={() =>
              propertiesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            style={{
              // Luxury styling override
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              padding: "16px 44px",
              fontSize: "12px",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              borderRadius: "9999px",
              cursor: "pointer",
              boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
              outline: "none",
              display: "inline-block",
            }}
            whileHover={{
              backgroundColor: "rgba(255, 255, 255, 1)",
              color: "#000000",
              borderColor: "#ffffff",
              letterSpacing: "0.18em",
              boxShadow: "0 10px 40px rgba(255, 255, 255, 0.25)",
              scale: 1.03,
            }}
            whileTap={{
              scale: 0.98,
            }}
            transition={{
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1], // Cinematic, smooth ease-out curve
            }}
          >
            Explore Hotels
          </motion.button>
        </div>
      </div>
    </section>
  );
}