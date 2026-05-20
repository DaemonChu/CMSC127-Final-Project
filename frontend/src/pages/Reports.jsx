import { useState, useCallback } from "react";
import styles from "../styles/Reports.module.css";

const API = "http://localhost:3000/api";

const LICENSE_TYPES    = ["Student Permit", "Non-Professional", "Professional"];
const LICENSE_STATUSES = ["valid", "expired", "suspended", "revoked"];
const SEX_OPTIONS      = ["Male", "Female"];
const VEHICLE_TYPES    = ["Motorcycle", "Private Car", "Public Utility Vehicle", "Truck", "Bus"];

const TODAY = new Date().toISOString().slice(0, 10);

const TABS = ["Drivers", "Vehicles", "Registrations", "Violations"];

const REPORT_CONFIGS = {
  Drivers: [
    {
      id: "by-license-type",
      label: "By License Type",
      filters: [
        
        { key: "type", label: "License Type", type: "select", options: LICENSE_TYPES, required: true },
      ],
      buildUrl: (p) => `${API}/drivers/reports/license-type?type=${enc(p.type)}`,
    },
    {
      id: "by-status",
      label: "By License Status",
      filters: [
        
        { key: "status", label: "License Status", type: "select", options: LICENSE_STATUSES, required: true },
      ],
      buildUrl: (p) => `${API}/drivers/reports/status?status=${enc(p.status)}`,
    },
    {
      id: "by-age-range",
      label: "By Age Range",
      filters: [
        
        {
          key: "ageRange",
          label: "Age Range",
          type: "range",
          subType: "number",
          keyFrom: "min",
          keyTo: "max",
          placeholderFrom: "Min age",
          placeholderTo: "Max age",
          min: 0,
          max: 120,
          required: true,
        },
      ],
      buildUrl: (p) => `${API}/drivers/reports/age-range?min=${p.min ?? ""}&max=${p.max ?? ""}`,
    },
    {
      id: "by-sex",
      label: "By Sex",
      filters: [
        
        { key: "sex", label: "Sex", type: "select", options: SEX_OPTIONS, required: true },
      ],
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
      filters: [
        
        { key: "license_number", label: "License #", type: "text", required: true },
        
        { key: "vehicleType", label: "Vehicle Type (optional)", type: "select", options: VEHICLE_TYPES },
      ],
      buildUrl: (p) =>
        `${API}/vehicles/reports/by-driver?license_number=${enc(p.license_number)}&vehicleType=${enc(p.vehicleType)}`,
    },
  ],
  Registrations: [
    {
      id: "expired",
      label: "Expired Registrations as of Date",
      filters: [
        
        { key: "as_of", label: "As of Date", type: "date", required: true, defaultValue: TODAY },
      ],
      buildUrl: (p) => `${API}/registrations/reports/expired?as_of=${p.as_of || TODAY}`,
    },
  ],
  Violations: [
    {
      id: "by-driver",
      label: "Violations by Driver & Date Range",
      filters: [
        
        { key: "license_number", label: "License #", type: "text", required: true },
        
        
        {
          key: "dateRange",
          label: "Date Range (optional)",
          type: "range",
          subType: "date",
          keyFrom: "from",
          keyTo: "to",
          placeholderFrom: "From",
          placeholderTo: "To",
          required: false,
        },
      ],
      buildUrl: (p) =>
        `${API}/violations/reports/by-driver?license_number=${enc(p.license_number)}&from=${p.from ?? ""}&to=${p.to ?? ""}`,
    },
    {
      id: "by-type-year",
      label: "Total Violations by Type (Year)",
      filters: [
        
        { key: "year", label: "Year", type: "number", required: true, min: 2000, max: 2100 },
      ],
      buildUrl: (p) => `${API}/violations/reports/by-type?year=${p.year ?? ""}`,
    },
    {
      id: "vehicles-by-city",
      label: "Vehicles in Violations by City / Region",
      filters: [
        
        { key: "city",   label: "City (optional)",   type: "text" },
        { key: "region", label: "Region (optional)", type: "text" },
      ],
      buildUrl: (p) =>
        `${API}/violations/reports/vehicles-by-city?city=${enc(p.city)}&region=${enc(p.region)}`,
    },
  ],
};

const enc = (v) => encodeURIComponent(v ?? "");


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
  if (col === "fine_amount")      return `₱${Number(val).toLocaleString()}`;
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


export default function Reports() {
  const [tab, setTab]                 = useState("Drivers");
  const [reportId, setReportId]       = useState(REPORT_CONFIGS["Drivers"][0].id);
  const [params, setParams]           = useState({});
  const [results, setResults]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [ran, setRan]                 = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const currentReports = REPORT_CONFIGS[tab];
  const currentReport  = currentReports.find((r) => r.id === reportId) ?? currentReports[0];

  const switchTab = (t) => {
    setTab(t);
    setReportId(REPORT_CONFIGS[t][0].id);
    setParams({}); setResults([]); setRan(false); setError(""); setFieldErrors({});
  };

  const switchReport = (id) => {
    setReportId(id);
    setParams({}); setResults([]); setRan(false); setError(""); setFieldErrors({});
  };

  const setParam = (k, v) => setParams((p) => ({ ...p, [k]: v }));

  const getParamValue = (key, defaultValue) => {
    if (params[key] !== undefined) return params[key];
    return defaultValue ?? "";
  };

  const runReport = useCallback(async () => {
    const errors = {};

    for (const f of currentReport.filters) {
      if (f.type === "range") {
        const fromVal = params[f.keyFrom] ?? "";
        const toVal   = params[f.keyTo]   ?? "";

        if (f.required) {
          if (!fromVal) errors[`${f.key}_from`] = `${f.placeholderFrom} is required`;
          if (!toVal)   errors[`${f.key}_to`]   = `${f.placeholderTo} is required`;
        }

        
        if (fromVal && toVal) {
          if (f.subType === "number" && Number(fromVal) > Number(toVal)) {
            errors[`${f.key}_from`] = "Min cannot be greater than Max";
          }
          if (f.subType === "date" && fromVal > toVal) {
            errors[`${f.key}_from`] = "Start date cannot be after end date";
          }
        }
      } else {
        const val = params[f.key] ?? f.defaultValue ?? "";
        if (f.required && !val) {
          errors[f.key] = `${f.label} is required`;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

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

  
  const renderRangeFilter = (f) => (
    <div key={f.key} className={styles.controlGroup}>
      <label className={styles.controlLabel}>
        {f.label}
        {f.required && <span className={styles.requiredMark}>&nbsp;*</span>}
      </label>
      <div className={styles.rangeRow}>
        <div className={styles.rangeHalf}>
          <input
            className={`${styles.controlInput} ${fieldErrors[`${f.key}_from`] ? styles.inputError : ""}`}
            type={f.subType}
            value={getParamValue(f.keyFrom)}
            onChange={(e) => setParam(f.keyFrom, e.target.value)}
            placeholder={f.placeholderFrom}
            min={f.min ?? undefined}
            max={f.max ?? undefined}
          />
          {fieldErrors[`${f.key}_from`] && (
            <span className={styles.fieldError}>{fieldErrors[`${f.key}_from`]}</span>
          )}
        </div>

        <span className={styles.rangeSep}>—</span>

        <div className={styles.rangeHalf}>
          <input
            className={`${styles.controlInput} ${fieldErrors[`${f.key}_to`] ? styles.inputError : ""}`}
            type={f.subType}
            value={getParamValue(f.keyTo)}
            onChange={(e) => setParam(f.keyTo, e.target.value)}
            placeholder={f.placeholderTo}
            min={f.min ?? undefined}
            max={f.max ?? undefined}
          />
          {fieldErrors[`${f.key}_to`] && (
            <span className={styles.fieldError}>{fieldErrors[`${f.key}_to`]}</span>
          )}
        </div>
      </div>
    </div>
  );

  
  const renderFilter = (f) => {
    if (f.type === "range") return renderRangeFilter(f);

    return (
      <div key={f.key} className={styles.controlGroup}>
        <label className={styles.controlLabel}>
          {f.label}
          {f.required && <span className={styles.requiredMark}>&nbsp;*</span>}
        </label>

        {f.type === "select" ? (
          <select
            className={`${styles.controlSelect} ${fieldErrors[f.key] ? styles.inputError : ""}`}
            value={getParamValue(f.key, f.defaultValue)}
            onChange={(e) => setParam(f.key, e.target.value)}
          >
            <option value="">— {f.required ? "Select one" : "All"} —</option>
            {f.options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        ) : (
          <input
            className={`${styles.controlInput} ${fieldErrors[f.key] ? styles.inputError : ""}`}
            type={f.type}
            value={getParamValue(f.key, f.defaultValue)}
            onChange={(e) => setParam(f.key, e.target.value)}
            placeholder={f.label}
            min={f.min ?? (f.type === "number" ? 0 : undefined)}
            max={f.max ?? undefined}
          />
        )}

        {fieldErrors[f.key] && (
          <span className={styles.fieldError}>{fieldErrors[f.key]}</span>
        )}
      </div>
    );
  };

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

        {/* dynamic filter inputs — range filters get special paired rendering */}
        {currentReport.filters.map((f) => renderFilter(f))}

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