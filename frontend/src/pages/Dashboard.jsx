import { useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css";

/* ── card definitions ──────────────────────────────────────── */
const CARDS = [
  {
    id: "drivers",
    label: "DRIVER MANAGEMENT",
    route: "/drivers",
    /* Using a royalty-free Unsplash car/driver photo as placeholder.
       Replace with your own asset in src/assets/ and import it here. */
    image:
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=70",
  },
  {
    id: "vehicles",
    label: "VEHICLE MANAGEMENT",
    route: "/vehicles",
    image:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=70",
  },
  {
    id: "registrations",
    label: "REGISTRATION",
    route: "/registrations",
    image: 
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_PLQAu5GbdcM3gOqNUkkT-h5RuwOx4fWUjw&s",
  },
  {
    id: "violations",
    label: "TRAFFIC VIOLATION",
    route: "/violations",
    image: 
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStfgwAmQ9HtnkYkCD689F3525rNK_DvybMKg&s",
  },
  {
    id: "reports",
    label: "REPORTS",
    route: "/reports",
    image: 
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlXls1s0t19XNQl5JYZhzsJwQjn5H0k2nLCA&s",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {/* ── Hero background ──────────────────────── */}
      <div className={styles.hero}>
        <svg
          className={styles.wave}
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M0,80 C360,20 720,120 1080,50 C1260,20 1380,80 1440,70 L1440,120 L0,120 Z"
            fill="#091852"
            opacity="1"
          />
        </svg>

        {/* ── Dashboard content ─────────────────── */}
        <div className={styles.content}>
          <h1 className={styles.title}>LTO PERSONNEL DASHBOARD</h1>

          <div className={styles.grid}>
            {CARDS.map((card, i) => (
              <DashCard key={card.id} card={card} index={i} navigate={navigate} />
            ))}
          </div>
        </div>
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
        <img
          src={card.image}
          alt=""
          className={styles.cardBg}
          aria-hidden="true"
        />
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