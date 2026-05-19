import { useState, useCallback } from "react";
import styles from "../styles/Reports.module.css";

const API = "http://localhost:3000/api";

// ─── Constants ───────────────────────────────────────────────
const LICENSE_TYPES    = ["Student Permit", "Non-Professional", "Professional"];
const LICENSE_STATUSES = ["valid", "expired", "suspended", "revoked"];
const SEX_OPTIONS      = ["Male", "Female"];

// ─── Tab definitions ─────────────────────────────────────────
const TABS = ["Drivers", "Vehicles", "Registrations", "Violations"];

// ─── Report configs per tab ──────────────────────────────────
// buildUrl must exactly match the route paths defined in the route files
const REPORT_CONFIGS = {
  Drivers: [
    {
      id: "by-license-type",
      label: "By License Type",
      filters: [{ key: "type", label: "License Type", type: "select", options: LICENSE_TYPES }],
      buildUrl: (p) => `${API}/drivers/reports/license-type?type=${enc(p.type)}`,
    },
    {
      id: "by-status",
      label: "By License Status",
      filters: [{ key: "status", label: "License Status", type: "select", options: LICENSE_STATUSES }],
      buildUrl: (p) => `${API}/drivers/reports/status?status=${enc(p.status)}`,
    },
    {
      id: "by-age-range",
      label: "By Age Range",
      filters: [
        { key: "min", label: "Min Age", type: "number" },
        { key: "max", label: "Max Age", type: "number" },
      ],
      buildUrl: (p) => `${API}/drivers/reports/age-range?min=${p.min ?? ""}&max=${p.max ?? ""}`,
    },
    {
      id: "by-sex",
      label: "By Sex",
      filters: [{ key: "sex", label: "Sex", type: "select", options: SEX_OPTIONS }],
      buildUrl: (p) => `${API}/drivers/reports/sex?sex=${enc(p.sex)}`,
    },
    {
      id: "bad-status",
      label: "Expired / Suspended Licenses",
      filters: [],
      buildUrl: () => `${API}/drivers/reports/bad-status`,
    },
  ],
  Vehicles: [
    {
      id: "by-driver",
      label: "Vehicles by Driver",
      filters: [{ key: "license_number", label: "License #", type: "text" }],
      // Routes to /vehicles/reports/by-driver which maps to searchVehicles
      buildUrl: (p) => `${API}/vehicles/reports/by-driver?license_number=${enc(p.license_number)}`,
    },
  ],
  Registrations: [
    {
      id: "expired",
      label: "Expired Registrations",
      filters: [{ key: "as_of", label: "As of Date", type: "date" }],
      // Routes to /registrations/reports/expired which maps ?as_of → expired=true&date=
      buildUrl: (p) => `${API}/registrations/reports/expired?as_of=${p.as_of ?? ""}`,
    },
  ],
  Violations: [
    {
      id: "by-driver",
      label: "By Driver & Date Range",
      filters: [
        { key: "license_number", label: "License #", type: "text" },
        { key: "from", label: "From", type: "date" },
        { key: "to", label: "To", type: "date" },
      ],
      buildUrl: (p) =>
        `${API}/violations/reports/by-driver?license_number=${enc(p.license_number)}&from=${p.from ?? ""}&to=${p.to ?? ""}`,
    },
    {
      id: "by-type-year",
      label: "Count by Type (Year)",
      filters: [{ key: "year", label: "Year", type: "number" }],
      buildUrl: (p) => `${API}/violations/reports/by-type?year=${p.year ?? ""}`,
    },
    {
      id: "vehicles-by-city",
      label: "Vehicles in Violations by City / Region",
      filters: [{ key: "city", label: "City / Region", type: "text" }],
      buildUrl: (p) => `${API}/violations/reports/vehicles-by-city?city=${enc(p.city)}`,
    },
  ],
};

const enc = (v) => encodeURIComponent(v ?? "");

// ─── Cell formatters ─────────────────────────────────────────
const STATUS_COLS = new Set([
  "license_status", "registration_status", "violation_status",
]);
const DATE_COLS = new Set([
  "date_of_birth", "license_issuance_date", "license_expiration_date",
  "registration_date", "expiration_date", "date", "violation_date",
]);

function formatCell(col, val) {
  if (val == null) return "—";
  if (DATE_COLS.has(col) && typeof val === "string") return val.slice(0, 10);
  if (col === "fine_amount") return `₱${Number(val).toLocaleString()}`;
  if (col === "total_violations") return Number(val).toLocaleString();
  return val.toString();
}

function getBadgeClass(val, s) {
  if (!val) return "";
  const v = val.toString().toLowerCase();
  if (["valid", "active", "paid"].includes(v))      return s.badgeGreen;
  if (["expired", "unpaid", "revoked"].includes(v)) return s.badgeRed;
  if (["suspended", "contested"].includes(v))        return s.badgeYellow;
  return "";
}

// ─── Component ───────────────────────────────────────────────
export default function Reports() {
  const [tab, setTab]           = useState("Drivers");
  const [reportId, setReportId] = useState(REPORT_CONFIGS["Drivers"][0].id);
  const [params, setParams]     = useState({});
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [ran, setRan]           = useState(false);

  const currentReports = REPORT_CONFIGS[tab];
  const currentReport  = currentReports.find((r) => r.id === reportId) ?? currentReports[0];

  const switchTab = (t) => {
    setTab(t);
    setReportId(REPORT_CONFIGS[t][0].id);
    setParams({}); setResults([]); setRan(false); setError("");
  };

  const switchReport = (id) => {
    setReportId(id);
    setParams({}); setResults([]); setRan(false); setError("");
  };

  const setParam = (k, v) => setParams((p) => ({ ...p, [k]: v }));

  const runReport = useCallback(async () => {
    setLoading(true); setError(""); setResults([]); setRan(false);
    try {
      const url = currentReport.buildUrl(params);
      const res = await fetch(url);
      if (res.status === 404) { setResults([]); setRan(true); return; }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Request failed (${res.status})`);
      }
      const data = await res.json();
      setResults(Array.isArray(data) ? data : data.result ?? []);
      setRan(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [currentReport, params]);

  const columns = results.length > 0 ? Object.keys(results[0]) : [];

  return (
    <div className={styles.page}>

      {/* title & category tabs */}
      <div className={styles.topBar}>
        <h1 className={styles.pageTitle}>Reports</h1>
        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
              onClick={() => switchTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* report picker, filter inputs, run button */}
      <div className={styles.controlsBar}>
        {/* report type selector */}
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Report Type</label>
          <select
            className={styles.controlSelect}
            value={reportId}
            onChange={(e) => switchReport(e.target.value)}
          >
            {currentReports.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* dynamic filter inputs */}
        {currentReport.filters.map((f) => (
          <div key={f.key} className={styles.controlGroup}>
            <label className={styles.controlLabel}>{f.label}</label>
            {f.type === "select" ? (
              <select
                className={styles.controlSelect}
                value={params[f.key] ?? ""}
                onChange={(e) => setParam(f.key, e.target.value)}
              >
                <option value="">— All —</option>
                {f.options.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                className={styles.controlInput}
                type={f.type}
                value={params[f.key] ?? ""}
                onChange={(e) => setParam(f.key, e.target.value)}
                placeholder={f.label}
                min={f.type === "number" ? 0 : undefined}
              />
            )}
          </div>
        ))}

        {currentReport.filters.length === 0 && (
          <span className={styles.noFilter}>No filters required</span>
        )}

        <button
          className={styles.btnRun}
          onClick={runReport}
          disabled={loading}
        >
          {loading ? "Running…" : "Run Report"}
        </button>
      </div>

      {/* results area */}
      <div className={styles.resultsArea}>
        {error && <div className={styles.errorBanner}>{error}</div>}

        {!ran && !error && !loading && (
          <div className={styles.placeholder}>
            <span className={styles.placeholderIcon}>📊</span>
            <p>Set your filters above and click <strong>Run Report</strong>.</p>
          </div>
        )}

        {loading && (
          <div className={styles.placeholder}>
            <p style={{ color: "#8898bb" }}>Fetching records…</p>
          </div>
        )}

        {ran && !loading && results.length === 0 && !error && (
          <div className={styles.placeholder}>
            <span className={styles.placeholderIcon}>🔍</span>
            <p>No records found for this query.</p>
          </div>
        )}

        {results.length > 0 && (
          <div className={styles.resultsWrap}>
            <div className={styles.resultsHeader}>
              <span className={styles.resultsCount}>
                {results.length} record{results.length !== 1 ? "s" : ""}
              </span>
              <span className={styles.reportName}>{currentReport.label}</span>
            </div>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col}>{col.replace(/_/g, " ")}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => (
                    <tr key={i}>
                      {columns.map((col) => (
                        <td key={col}>
                          {STATUS_COLS.has(col) ? (
                            <span className={`${styles.badge} ${getBadgeClass(row[col], styles)}`}>
                              {row[col] ?? "—"}
                            </span>
                          ) : (
                            formatCell(col, row[col])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}