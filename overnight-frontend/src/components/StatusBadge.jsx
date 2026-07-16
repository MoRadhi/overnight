const CONFIG = {
  BOOKED: {
    label: "Booked",
    bg: "rgba(79,168,160,0.15)",
    color: "var(--on-secondary)",
  },
  CHECKED_IN: {
    label: "Checked in",
    bg: "rgba(232,162,61,0.15)",
    color: "var(--on-accent)",
  },
  CHECKED_OUT: {
    label: "Checked out",
    bg: "rgba(111,191,138,0.15)",
    color: "var(--on-success)",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "rgba(107,114,128,0.15)",
    color: "var(--on-text-faint)",
  },
};

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] ?? {
    label: status,
    bg: "var(--on-border)",
    color: "var(--on-text-muted)",
  };
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        fontWeight: 500,
        fontSize: "0.78rem",
        padding: "3px 10px",
        borderRadius: "99px",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}
