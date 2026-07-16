import React from "react";
import { motion } from "framer-motion";

export default function DiningSection({ innerRef }) {
  // Split paragraphs or list items for staggered enter animations
  const diningFacts = [
    {
      title: "Michelin-Starred Masters",
      description: "Menus designed and executed by celebrated culinary visionaries, bringing global haute cuisine straight to your table."
    },
    {
      title: "Rare Vintage Reserves",
      description: "Bespoke pairings hand-selected by elite sommeliers, drawn from limited-allocation private cellars."
    },
    {
      title: "An Intimate Chef’s Table",
      description: "Custom multi-course journeys crafted on-demand to match your exact preferences, served in total privacy."
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const iconVariants = {
    hover: { 
      rotate: 180, 
      scale: 1.2,
      transition: { duration: 0.6, ease: "easeInOut" }
    }
  };

  return (
    <section className="dining-section dining-section--landing" ref={innerRef}>
      <div className="dining-shell">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="dining-media"
        >
          <motion.img
            src="/images/experience-dining.jpg"
            alt="Candlelit fine dining room with city view"
            loading="lazy"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="dining-media__img"
          />
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.span variants={itemVariants} className="dining-heading__eyebrow">
            The Art of Gastronomy
          </motion.span>

          <motion.h2 variants={itemVariants} className="dining-heading__title">
            Michelin-Starred Dining, Curated Privately
          </motion.h2>

          <motion.p variants={itemVariants} className="dining-heading__lead">
            Savor exceptional culinary journeys led by legendary master chefs. From rare, estate-grown ingredients harvested at dawn to bespoke sommelier pairings, we bring the peak of global fine dining directly to your suite.
          </motion.p>

          <div className="dining-facts-list">
            {diningFacts.map((fact, index) => (
              <motion.div key={index} variants={itemVariants} className="dining-fact-row">
                <motion.span variants={iconVariants} whileHover="hover" className="dining-fact-icon">
                  ✦
                </motion.span>

                <div className="dining-fact-content">
                  <h4 className="dining-fact-title">{fact.title}</h4>
                  <p className="dining-fact-copy">{fact.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}