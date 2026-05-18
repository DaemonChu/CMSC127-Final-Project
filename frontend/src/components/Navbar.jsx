import { NavLink, useNavigate } from "react-router-dom";
import ltoLogo from "../assets/lto-logo.png";
import styles from "../styles/Navbar.module.css";

const navLinks = [
  { to: "/drivers",       label: "Driver" },
  { to: "/vehicles",      label: "Vehicle" },
  { to: "/registrations", label: "Vehicle Registration" },
  { to: "/violations",    label: "Traffic Violation" },
  { to: "/reports",       label: "Reports" },
];

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className={styles.navbar}>
      <div
        className={styles.brand}
        onClick={() => navigate("/")}
        role="button"
        tabIndex={0}
        aria-label="Go to Dashboard"
        onKeyDown={(e) => e.key === "Enter" && navigate("/")}
      >
        <img src={ltoLogo} alt="LTO logo" className={styles.logo} />
      </div>
      <ul className={styles.links}>
        {navLinks.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}