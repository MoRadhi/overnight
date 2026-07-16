import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useAuth } from "../context/useAuth";

export default function AppNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const navRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // One-time entrance cascade — brand, then links, then actions.
  useEffect(() => {
    if (!navRef.current) return;
    const items = navRef.current.querySelectorAll("[data-nav-item]");
    gsap.fromTo(
      items,
      { y: -14, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.06,
        delay: 0.15,
      },
    );
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav ref={navRef} className={`on-nav${scrolled ? " is-scrolled" : ""}`}>
      {/* Brand */}
      <Link
        to="/"
        className="on-nav__brand"
        data-nav-item
        onClick={() => setMenuOpen(false)}
      >
        Overnight
      </Link>

      {/* Desktop links */}
      <ul className="on-nav__links">
        <li data-nav-item>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `on-nav__link${isActive ? " active" : ""}`
            }
            onClick={(e) => {
              e.preventDefault();
              const dest = document.getElementById("destinations");
              if (dest) {
                dest.scrollIntoView({ behavior: "smooth" });
              } else {
                navigate("/");
              }
            }}
          >
            Properties
          </NavLink>
        </li>
        {isAuthenticated && (
          <>
            <li data-nav-item>
              <NavLink
                to="/admin/analytics"
                className={({ isActive }) =>
                  `on-nav__link${isActive ? " active" : ""}`
                }
              >
                Analytics
              </NavLink>
            </li>
            <li data-nav-item>
              <NavLink
                to="/admin/reservations"
                className={({ isActive }) =>
                  `on-nav__link${isActive ? " active" : ""}`
                }
              >
                Reservations
              </NavLink>
            </li>
            <li data-nav-item>
              <NavLink
                to="/admin/hotels"
                className={({ isActive }) =>
                  `on-nav__link${isActive ? " active" : ""}`
                }
              >
                Hotels
              </NavLink>
            </li>
            <li data-nav-item>
              <NavLink
                to="/admin/rooms"
                className={({ isActive }) =>
                  `on-nav__link${isActive ? " active" : ""}`
                }
              >
                Rooms
              </NavLink>
            </li>
          </>
        )}
      </ul>

      {/* Actions */}
      <div className="on-nav__actions">
        {isAuthenticated ? (
          <button className="btn-ghost" data-nav-item onClick={handleLogout}>
            Sign Out
          </button>
        ) : (
          <Link
            to="/admin/login"
            className="btn-ghost"
            data-nav-item
            style={{ fontSize: "0.72rem" }}
          >
            Admin
          </Link>
        )}

        {/* Mobile hamburger */}
        <button
          className="on-nav__mobile-toggle"
          data-nav-item
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
            <rect
              y="0"
              width="22"
              height="2"
              rx="1"
              fill="currentColor"
              style={{
                transition: "0.3s",
                transformOrigin: "center",
                transform: menuOpen ? "rotate(45deg) translateY(7px)" : "none",
              }}
            />
            <rect
              y="7"
              width="22"
              height="2"
              rx="1"
              fill="currentColor"
              style={{ transition: "0.3s", opacity: menuOpen ? 0 : 1 }}
            />
            <rect
              y="14"
              width="22"
              height="2"
              rx="1"
              fill="currentColor"
              style={{
                transition: "0.3s",
                transformOrigin: "center",
                transform: menuOpen
                  ? "rotate(-45deg) translateY(-7px)"
                  : "none",
              }}
            />
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "rgba(8, 6, 5, 0.97)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(201,168,76,0.12)",
            padding: "1rem 1.5rem 1.5rem",
            zIndex: 998,
          }}
        >
          {[{ to: "/", label: "Properties" },
          ...(isAuthenticated
              ? [
                  { to: "/admin/analytics", label: "Analytics" },
                  { to: "/admin/reservations", label: "Reservations" },
                  { to: "/admin/hotels", label: "Hotels" },
                ]
              : [{ to: "/admin/login", label: "Admin" }])].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="on-nav__link"
              style={{ display: "block", marginBottom: "0.25rem" }}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          {isAuthenticated && (
            <button
              className="btn-ghost"
              style={{ marginTop: "0.75rem" }}
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
            >
              Sign Out
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
