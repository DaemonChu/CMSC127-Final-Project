import { NavLink } from "react-router-dom";
import ltoLogo from "../assets/lto-logo.png";
import styles from "./Navbar.module.css";

const navLinks = [
  { to: "/drivers",       label: "Driver" },
  { to: "/vehicles",      label: "Vehicle" },
  { to: "/registrations", label: "Vehicle Registration" },
  { to: "/violations",    label: "Traffic Violation" },
  { to: "/reports",       label: "Reports" },
];

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.brand}>
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