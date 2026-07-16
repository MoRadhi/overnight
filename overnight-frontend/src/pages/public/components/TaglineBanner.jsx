import React from "react";
import { motion } from "framer-motion";

export default function TaglineBanner() {
  const tagline = "The world's finest addresses, from the medinas of Marrakesh to the fjords of Bergen, from Kyoto's garden temples to the seafront grandeur of Mumbai.";
  
  // 1. Split the tagline into individual words
  const words = tagline.split(" ");

  // Animation variants (Your original, smooth settings!)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.02, delayChildren: 0.2 },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section className="tagline-banner">
      <div className="tagline-banner__glow" />

      <div className="tagline-banner__content">
        {/* Animated Staggered Text */}
        <motion.p
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="tagline-banner__quote"
        >
          {words.map((word, wordIndex) => (
            <React.Fragment key={wordIndex}>
              {/* This wrapper span prevents the letters inside this specific word from breaking */}
              <span className="tagline-banner__word">
                {word.split("").map((char, charIndex) => (
                  <motion.span
                    key={charIndex}
                    variants={letterVariants}
                    className="tagline-banner__letter"
                  >
                    {char}
                  </motion.span>
                ))}
              </span>
              {/* Add a standard wrapping space between words */}
              {wordIndex < words.length - 1 && " "}
            </React.Fragment>
          ))}
        </motion.p>

        {/* Animated Divider and Subtext */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUpVariants}
          className="gold-rule tagline-banner__divider"
        />
        
        <motion.span
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUpVariants}
          className="tagline-banner__meta"
        >
          Overnight Collection
        </motion.span>
      </div>
    </section>
  );
}