import { Link } from "react-router-dom";

const COUNTRY_FLAGS = {
  France: "🇫🇷",
  Portugal: "🇵🇹",
  Japan: "🇯🇵",
  Spain: "🇪🇸",
  Norway: "🇳🇴",
  Italy: "🇮🇹",
  Morocco: "🇲🇦",
  India: "🇮🇳",
};

export default function Footer() {
  const year = new Date().getFullYear();
  const assurances = [
    {
      code: "T-01",
      title: "Trust Program",
      meta: "SOC 2 controls in progress",
      tone: "amber",
    },
    {
      code: "D-24",
      title: "Data Governance",
      meta: "GDPR-aligned processing model",
      tone: "teal",
    },
    {
      code: "O-77",
      title: "Ops Continuity",
      meta: "24/7 incident command desk",
      tone: "violet",
    },
    {
      code: "P-08",
      title: "Portfolio Scale",
      meta: "Multi-property orchestration",
      tone: "blue",
    },
  ];
  const offices = [
    "Paris",
    "Lisbon",
    "Tokyo",
    "Barcelona",
    "Oslo",
    "Rome",
    "Marrakech",
    "Jaipur",
  ];

  return (
    <footer className="footer">
      <div className="container-on">
        <div className="footer__meta">
          <span>Global Hospitality Technology Group</span>
          <span>Enterprise Booking & Analytics Platform</span>
        </div>

        <div className="footer__badges" aria-label="Assurance highlights">
          {assurances.map((item) => (
            <div
              key={item.code}
              className={`footer__assurance footer__assurance--${item.tone}`}
            >
              <span className="footer__assurance-code">{item.code}</span>
              <div className="footer__assurance-copy">
                <span className="footer__assurance-title">{item.title}</span>
                <span className="footer__assurance-meta">{item.meta}</span>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1.2fr",
            gap: "3rem",
          }}
          className="footer-grid"
        >
          {/* Brand col */}
          <div>
            <div className="footer__brand">Overnight</div>
            <p className="footer__tagline">
              Eight extraordinary properties across eight countries. Where every
              stay becomes a memory that lasts.
            </p>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              {Object.entries(COUNTRY_FLAGS).map(([c, f]) => (
                <span
                  key={c}
                  title={c}
                  style={{ fontSize: "1.3rem", cursor: "default" }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Platform col */}
          <div>
            <div className="footer__col-head">Platform</div>
            <a href="#" className="footer__link">
              Property Operations Suite
            </a>
            <a href="#" className="footer__link">
              Revenue & Demand Intelligence
            </a>
            <a href="#" className="footer__link">
              Guest Experience Workspace
            </a>
            <a href="#" className="footer__link">
              Enterprise Admin Console
            </a>
          </div>

          {/* Company col */}
          <div>
            <div className="footer__col-head">Company</div>
            <a href="#" className="footer__link">
              About Overnight Group
            </a>
            <a href="#" className="footer__link">
              Security & Trust Center
            </a>
            <a href="#" className="footer__link">
              Press & Investor Relations
            </a>
            <a href="#" className="footer__link">
              Careers
            </a>
            <a href="mailto:stay@overnight.com" className="footer__link">
              Contact Us
            </a>
            <Link to="/admin/login" className="footer__link">
              Admin Login
            </Link>
          </div>

          {/* Operations col */}
          <div>
            <div className="footer__col-head">Operations</div>
            <span className="footer__link" style={{ cursor: "default" }}>
              Service Desk: 24/7
            </span>
            <span className="footer__link" style={{ cursor: "default" }}>
              Enterprise Onboarding Team
            </span>
            <span className="footer__link" style={{ cursor: "default" }}>
              Dedicated Account Management
            </span>
            <span className="footer__link" style={{ cursor: "default" }}>
              Global Offices: {offices.length}
            </span>
          </div>
        </div>

        {/* Aurora divider */}
        <div className="footer__aurora-rule" />

        <div className="footer__bottom">
          <span>© {year} Overnight. All rights reserved.</span>
          <span style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <a href="#" className="footer__link" style={{ margin: 0 }}>
              Privacy
            </a>
            <a href="#" className="footer__link" style={{ margin: 0 }}>
              Terms
            </a>
            <a href="#" className="footer__link" style={{ margin: 0 }}>
              Cookies
            </a>
            <a href="#" className="footer__link" style={{ margin: 0 }}>
              Accessibility
            </a>
            <a href="#" className="footer__link" style={{ margin: 0 }}>
              Legal Notice
            </a>
          </span>
        </div>
      </div>

      {/* Responsive footer-grid */}
      <style>{`
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          .footer-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
        }
      `}</style>
    </footer>
  );
}
