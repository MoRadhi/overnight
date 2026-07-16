import React from "react";
import { motion } from "framer-motion";

export default function Pillars({ innerRef }) {
  // Simple, luxurious content mapping
  const cards = [
    {
      id: "01",
      tag: "Anticipation",
      title: "Predictive Hospitality",
      desc: "Our hosts observe, remember, and anticipate your preferences hours before you think to ask—from your exact room climate to curated local introductions.",
      class: "bento-card-1",
    },
    {
      id: "02",
      tag: "Sanctuary",
      title: "Absolute Discretion",
      desc: "Architecturally crafted for ultimate privacy. Enjoy quiet acoustic proofing, seamless private entryways, and absolute anonymity throughout your stay.",
      class: "bento-card-2",
    },
    {
      id: "03",
      tag: "Flexibility",
      title: "No-Limit Checkout",
      desc: "Adapt your departure to your travel schedule. Sleep late, host final meetings, and check out when it makes absolute sense.",
      class: "bento-card-3",
    },
    {
      id: "04",
      tag: "Access",
      title: "Verified Priority",
      desc: "Seamlessly unlock priority reservations and immediate suite upgrades across all sixteen of our global estates.",
      class: "bento-card-4",
    },
  ];

  // Entrance animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section ref={innerRef} className="pillars-section">
      <div className="pillars-shell">
        <div className="pillars-header">
          <span className="pillars-header__eyebrow">The Overnight Experience</span>
          <h2 className="pillars-header__title">Redefining the Pillars of Stay</h2>
        </div>

        <motion.div
          className="pillars-bento-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {cards.map((card) => (
            <motion.div
              key={card.id}
              className={`pillars-bento-grid__card ${card.class}`}
              variants={cardVariants}
              whileHover={{
                y: -6,
                borderColor: "rgba(223, 178, 108, 0.4)",
                boxShadow: "0 12px 30px rgba(223, 178, 108, 0.05)",
              }}
            >
              <div className="pillars-bento-grid__card-header">
                <span className="pillars-bento-grid__card-tag">{card.tag}</span>
                <span className="pillars-bento-grid__card-id">{card.id}</span>
              </div>

              <div className="pillars-bento-grid__card-body">
                <h3 className="pillars-bento-grid__card-title">{card.title}</h3>
                <p className="pillars-bento-grid__card-desc">{card.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}