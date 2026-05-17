import { useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css";
import wave1 from "../assets/wave1.png";
import wave2 from "../assets/wave2.png";

/* ── card definitions ──────────────────────────────────────── */
const CARDS = [
  {
    id: "drivers",
    label: "DRIVER MANAGEMENT",
    route: "/drivers",
    image: "https://www.filipinotravel.com.ph/wp-content/uploads/2017/01/Caloy.jpg",
  },
  {
    id: "vehicles",
    label: "VEHICLE MANAGEMENT",
    route: "/vehicles",
    image: "https://cdn.prod.website-files.com/67dc412233fc00dc82b9c97b/68a2db43fd1568fc360dff0c_Blog19-Photo01.png",
  },
  {
    id: "registrations",
    label: "REGISTRATION",
    route: "/registrations",
    image: "https://www.autodeal.com.ph/custom/blog-post/header/lost-your-cars-certificate-of-registration-61d28c1d4000f.jpg",
  },
  {
    id: "violations",
    label: "TRAFFIC VIOLATION",
    route: "/violations",
    image: "https://newsinfo.inquirer.net/files/2020/03/News34441-1536x994.jpg",
  },
  {
    id: "reports",
    label: "REPORTS",
    route: "/reports",
    image: "https://www.rib-software.com/app/uploads/2024/06/types-of-reports-rib-blog.webp",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <div className={styles.hero}>

        {/* ── Wave Top ─────────────────────────────── */}
        <img src={wave1} alt="" className={styles.waveTop} aria-hidden="true" />

        {/* ── Dashboard content ─────────────────── */}
        <div className={styles.content}>
          <h1 className={styles.title}>LTO PERSONNEL DASHBOARD</h1>
          <div className={styles.grid}>
            {CARDS.map((card, i) => (
              <DashCard key={card.id} card={card} index={i} navigate={navigate} />
            ))}
          </div>
        </div>

        {/* ── Wave Bottom ──────────────────────────── */}
        <img src={wave2} alt="" className={styles.waveBottom} aria-hidden="true" />

      </div>
    </div>
  );
}

/* ── individual card ──────────────────────────────────────── */
function DashCard({ card, index, navigate }) {
  const hasImage = Boolean(card.image);
  return (
    <div
      className={`${styles.card} ${hasImage ? styles.cardImage : styles.cardPlain}`}
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={() => navigate(card.route)}
      role="button"
      tabIndex={0}
      aria-label={`Go to ${card.label}`}
      onKeyDown={(e) => e.key === "Enter" && navigate(card.route)}
    >
      {hasImage && (
        <img src={card.image} alt="" className={styles.cardBg} aria-hidden="true" />
      )}
      <div className={styles.cardBody}>
        <span className={styles.cardLabel}>{card.label}</span>
        <a
          className={styles.manageLink}
          onClick={(e) => { e.stopPropagation(); navigate(card.route); }}
          href="#"
          aria-label={`Manage ${card.label}`}
        >
          Manage →
        </a>
      </div>
    </div>
  );
}