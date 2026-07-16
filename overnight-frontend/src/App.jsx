import { Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import AppNavbar from "./components/AppNavbar";
import Footer from "./components/Footer";
import RequireAuth from "./components/RequireAuth";
import useLenis from "./hooks/useLenis";

// Public pages
import Home from "./pages/public/Home";
import HotelDetail from "./pages/public/HotelDetail";
import BookingForm from "./pages/public/BookingForm";

// Admin pages
import Login from "./pages/admin/Login";
import Analytics from "./pages/admin/Analytics";
import Hotels from "./pages/admin/Hotels";
import Reservations from "./pages/admin/Reservations";
import Rooms from "./pages/admin/Rooms";

import "./theme.css";

/** Film grain — a single inline SVG filter, no HTTP requests, ~0 cost. */
function GrainOverlay() {
  return (
    <div className="grain-overlay" aria-hidden="true">
      <svg>
        <filter id="grainFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grainFilter)" />
      </svg>
    </div>
  );
}

/** Public pages: Navbar + page content + Footer */
function PublicLayout() {
  return (
    <>
      <AppNavbar />
      <Outlet />
      <Footer />
    </>
  );
}

/** Admin pages: Navbar + auth guard + page content, no footer */
function AdminLayout() {
  return (
    <RequireAuth>
      <AppNavbar />
      <div className="on-admin-shell" style={{ paddingTop: "80px" }}>
        <Outlet />
      </div>
    </RequireAuth>
  );
}

export default function App() {
  useLenis();

  return (
    <AuthProvider>
      <GrainOverlay />
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/hotels/:id" element={<HotelDetail />} />
          <Route path="/hotels/:id/book" element={<BookingForm />} />
        </Route>

        {/* Auth */}
        <Route path="/admin/login" element={<Login />} />

        {/* Admin (protected) */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/hotels" element={<Hotels />} />
          <Route path="/admin/reservations" element={<Reservations />} />
          <Route path="/admin/rooms" element={<Rooms />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
