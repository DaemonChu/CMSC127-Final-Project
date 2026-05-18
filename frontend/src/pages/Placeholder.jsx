/* Generic placeholder - used by Drivers, Vehicles, Registrations, Violations, and Reports pages until you build their real UI.
   Each page imports this and passes its own title/color. */

import styles from "./Placeholder.module.css";

export default function Placeholder({ title, icon }) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.icon} aria-hidden="true">{icon}</span>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.sub}>This page is under construction. Connect it to the backend when ready.</p>
      </div>
    </div>
  );
}