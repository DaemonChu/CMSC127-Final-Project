import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.copy}>© 2026 Land Transportation Office</span>
      <div className={styles.links}>
        <a href="#" className={styles.link}>Contact</a>
        <a href="#" className={styles.link}>Terms</a>
        <a href="#" className={styles.link}>Privacy</a>
      </div>
    </footer>
  );
}