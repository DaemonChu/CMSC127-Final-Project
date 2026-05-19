// src/pages/Violations.jsx
import { useEffect, useState, useCallback } from "react";
import styles from "../styles/Drivers.module.css";

// ── API base — Vite proxy forwards /api → localhost:3000
const API = "/api/violations";

const VIOLATION_TYPES    = [
  "Overspeeding",
  "Reckless Driving",
  "Illegal Parking",
  "Beating Red Light",
  "No Helmet",
  "No Seatbelt",
  "Drunk Driving",
  "Other",
];
const VIOLATION_STATUSES = ["unpaid", "paid", "contested"];

const SORT_OPTIONS = [
  { value: "date",                 label: "Date"           },
  { value: "fine_amount",          label: "Fine Amount"    },
  { value: "violation_type",       label: "Type"           },
  { value: "violation_status",     label: "Status"         },
  { value: "city",                 label: "City"           },
  { value: "province",             label: "Province"       },
  { value: "apprehending_officer", label: "Officer"        },
];

const EMPTY_FORM = {
  violation_ticket_id:  "",
  violation_type:       "",
  violation_status:     "",
  barangay:             "",
  city:                 "",
  province:             "",
  region:               "",
  date:                 "",
  fine_amount:          "",
  apprehending_officer: "",
  license_number:       "",
  MV_number:            "",
};

export default function Violations() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const [selected, setSelected]       = useState(null);
  const [mode, setMode]               = useState("view");
  const [form, setForm]               = useState(EMPTY_FORM);
  const [formError, setFormError]     = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting]   = useState(false);

  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType,   setFilterType]   = useState("");
  const [sortBy,       setSortBy]       = useState("");
  const [order,        setOrder]        = useState("desc");
  const [showArchived, setShowArchived] = useState(false);

  const [deleteConfirm,  setDeleteConfirm]  = useState(null);
  const [archiveConfirm, setArchiveConfirm] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────
  // All filters (type, status, sort) are sent as query params to the backend.
  // No client-side filtering — the backend handles everything in SQL.
  // This means the backend getAllViolations service needs to accept
  // ?type= and ?status= query params (see trafficViolationServices.js fix below).
  const fetchViolations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();

      // Sort
      if (sortBy) {
        params.set("sortBy", sortBy);
        params.set("order", order);
      }

      // Filters — always sent as params regardless of search state
      if (filterStatus) params.set("status", filterStatus);
      if (filterType)   params.set("type",   filterType);

      let url;

      if (search.trim()) {
        // Search endpoint: keyword + archived flag + filters + sort
        params.set("keyword",    search.trim());
        params.set("isArchived", showArchived ? "true" : "false");
        // Pass type/status to search too so they combine with keyword
        url = `${API}/search?${params}`;
      } else if (showArchived) {
        url = `${API}/archived?${params}`;
      } else {
        url = `${API}?${params}`;
      }

      const res = await fetch(url);

      // 404 means genuinely no records — clear list, no error banner
      if (res.status === 404) { setViolations([]); return; }
      if (!res.ok) throw new Error("Failed to fetch violations");

      const data = await res.json();
      setViolations(Array.isArray(data) ? data : (data.result ?? []));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterType, showArchived, sortBy, order]);

  useEffect(() => { fetchViolations(); }, [fetchViolations]);

  // ── Filter helpers ─────────────────────────────────────────────────────
  const clearFilters = () => {
    setSearch("");
    setFilterStatus("");
    setFilterType("");
    setSortBy("");
    setOrder("desc");
  };

  const hasActiveFilters = search || filterStatus || filterType || sortBy;

  // ── Panel helpers ──────────────────────────────────────────────────────
  const openAdd = () => {
    setSelected(null); setForm(EMPTY_FORM);
    setMode("add"); setFormError(""); setFormSuccess("");
  };

  const openEdit = (v) => {
    setSelected(v);
    setForm({
      violation_ticket_id:  v.violation_ticket_id,
      violation_type:       v.violation_type,
      violation_status:     v.violation_status,
      barangay:             v.barangay             ?? "",
      city:                 v.city                 ?? "",
      province:             v.province             ?? "",
      region:               v.region               ?? "",
      date:                 v.date?.slice(0, 10)   ?? "",
      fine_amount:          v.fine_amount?.toString() ?? "",
      apprehending_officer: v.apprehending_officer ?? "",
      license_number:       v.license_number       ?? "",
      MV_number:            v.MV_number            ?? "",
    });
    setMode("edit"); setFormError(""); setFormSuccess("");
  };

  const openView   = (v) => { setSelected(v); setMode("view"); setFormError(""); setFormSuccess(""); };
  const closePanel = ()  => { setSelected(null); setMode("view"); setForm(EMPTY_FORM); setFormError(""); setFormSuccess(""); };
  const handleField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // ── CRUD handlers ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setFormError(""); setFormSuccess(""); setSubmitting(true);
    try {
      let res;
      if (mode === "add") {
        res = await fetch(API, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(form),
        });
      } else {
        const { violation_ticket_id, ...updateData } = form;
        res = await fetch(`${API}/${selected.violation_ticket_id}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(updateData),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");
      setFormSuccess(mode === "add" ? "Violation recorded." : "Violation updated.");
      fetchViolations();
      if (mode === "add") closePanel();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (ticketId) => {
    try {
      const res  = await fetch(`${API}/${ticketId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete");
      setDeleteConfirm(null); fetchViolations(); closePanel();
    } catch (e) { setFormError(e.message); }
  };

  const handleArchive = async (ticketId) => {
    try {
      const endpoint = showArchived
        ? `${API}/unarchive/${ticketId}`
        : `${API}/archive/${ticketId}`;
      const res  = await fetch(endpoint, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update archive status");
      setArchiveConfirm(null); fetchViolations(); closePanel();
    } catch (e) { setFormError(e.message); }
  };

  const statusClass = (s) => {
    if (!s) return "";
    if (s === "paid")      return styles.statusValid;
    if (s === "unpaid")    return styles.statusExpired;
    if (s === "contested") return styles.statusSuspended;
    return "";
  };

  const panelOpen = mode === "add" || selected !== null;

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>
            {showArchived ? "Archived Violations" : "Traffic Violations"}
          </h1>
        </div>
        <div className={styles.headerRight}>
          <input
            className={styles.search}
            placeholder="Search by ticket ID, license #, MV #, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className={showArchived ? styles.btnArchive : styles.btnCancel}
            onClick={() => { setShowArchived((v) => !v); closePanel(); clearFilters(); }}
          >
            {showArchived ? "← Active" : "🗄 Archived"}
          </button>
          {!showArchived && (
            <button className={styles.btnAdd} onClick={openAdd}>+ Add Violation</button>
          )}
        </div>
      </div>

      {/* ── Filter / Sort Bar ── */}
      <div className={styles.filterBar}>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status</label>
          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {VIOLATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Violation Type</label>
          <select
            className={styles.filterSelect}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            {VIOLATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Sort By</label>
          <select
            className={styles.filterSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="">Default</option>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {sortBy && (
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Order</label>
            <div className={styles.orderToggle}>
              <button
                className={`${styles.orderBtn} ${order === "asc"  ? styles.orderActive : ""}`}
                onClick={() => setOrder("asc")}
              >↑ Asc</button>
              <button
                className={`${styles.orderBtn} ${order === "desc" ? styles.orderActive : ""}`}
                onClick={() => setOrder("desc")}
              >↓ Desc</button>
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <button className={styles.btnClearFilters} onClick={clearFilters}>✕ Clear</button>
        )}
      </div>

      {/* ── Body ── */}
      <div className={`${styles.body} ${panelOpen ? styles.bodyWithPanel : ""}`}>

        <div className={styles.tableWrap}>
          {error && <div className={styles.errorBanner}>{error}</div>}
          {loading ? (
            <div className={styles.empty}>Loading…</div>
          ) : violations.length === 0 ? (
            <div className={styles.empty}>
              {showArchived ? "No archived violations found." : "No violations found."}
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>License #</th>
                  <th>MV #</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>City</th>
                  <th>Fine</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {violations.map((v) => (
                  <tr
                    key={v.violation_ticket_id}
                    className={selected?.violation_ticket_id === v.violation_ticket_id ? styles.rowSelected : ""}
                    onClick={() => openView(v)}
                  >
                    <td className={`${styles.nameCell} ${styles.mono}`}>{v.violation_ticket_id}</td>
                    <td className={styles.mono}>{v.license_number ?? "—"}</td>
                    <td className={styles.mono}>{v.MV_number ?? "—"}</td>
                    <td>{v.violation_type}</td>
                    <td>{v.date?.slice(0, 10)}</td>
                    <td>{v.city ?? "—"}</td>
                    <td>₱{Number(v.fine_amount).toLocaleString()}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${statusClass(v.violation_status)}`}>
                        {v.violation_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Side Panel ── */}
        {panelOpen && (
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>
                {mode === "add"  ? "Record Violation" :
                 mode === "edit" ? "Edit Violation"   : "Violation Details"}
              </span>
              <button className={styles.closeBtn} onClick={closePanel}>✕</button>
            </div>

            <div className={styles.panelBody}>
              {mode === "view" && selected && (
                <>
                  <DetailRow label="Ticket ID"   value={selected.violation_ticket_id} mono />
                  <DetailRow label="License #"   value={selected.license_number} mono />
                  <DetailRow label="MV #"        value={selected.MV_number} mono />
                  <DetailRow label="Type"        value={selected.violation_type} />
                  <DetailRow label="Date"        value={selected.date?.slice(0, 10)} />
                  <DetailRow label="Barangay"    value={selected.barangay} />
                  <DetailRow label="City"        value={selected.city} />
                  <DetailRow label="Province"    value={selected.province} />
                  <DetailRow label="Region"      value={selected.region} />
                  <DetailRow label="Fine Amount" value={`₱${Number(selected.fine_amount).toLocaleString()}`} />
                  <DetailRow label="Officer"     value={selected.apprehending_officer || "—"} />
                  <DetailRow label="Status">
                    <span className={`${styles.statusBadge} ${statusClass(selected.violation_status)}`}>
                      {selected.violation_status}
                    </span>
                  </DetailRow>

                  {formError && <p className={styles.formError}>{formError}</p>}

                  <div className={styles.panelActions}>
                    {!showArchived && (
                      <button className={styles.btnEdit} onClick={() => openEdit(selected)}>Edit</button>
                    )}
                    <button className={styles.btnArchive} onClick={() => setArchiveConfirm(selected)}>
                      {showArchived ? "Restore" : "Archive"}
                    </button>
                    <button className={styles.btnDelete} onClick={() => setDeleteConfirm(selected.violation_ticket_id)}>
                      Delete
                    </button>
                  </div>
                </>
              )}

              {(mode === "add" || mode === "edit") && (
                <>
                  <FormField
                    label="Ticket ID (leave blank to auto-generate)"
                    name="violation_ticket_id"
                    value={form.violation_ticket_id}
                    onChange={handleField}
                    disabled={mode === "edit"}
                  />
                  <FormField  label="License #"            name="license_number"       value={form.license_number}       onChange={handleField} />
                  <FormField  label="MV #"                 name="MV_number"            value={form.MV_number}            onChange={handleField} />
                  <FormSelect label="Violation Type"       name="violation_type"       value={form.violation_type}       onChange={handleField} options={VIOLATION_TYPES} />
                  <FormSelect label="Status"               name="violation_status"     value={form.violation_status}     onChange={handleField} options={VIOLATION_STATUSES} />
                  <FormField  label="Date"                 name="date"                 type="date"   value={form.date}           onChange={handleField} />
                  <FormField  label="Barangay"             name="barangay"             value={form.barangay}             onChange={handleField} />
                  <FormField  label="City"                 name="city"                 value={form.city}                 onChange={handleField} />
                  <FormField  label="Province"             name="province"             value={form.province}             onChange={handleField} />
                  <FormField  label="Region"               name="region"               value={form.region}               onChange={handleField} />
                  <FormField  label="Fine Amount (₱)"      name="fine_amount"          type="number" value={form.fine_amount}     onChange={handleField} />
                  <FormField  label="Apprehending Officer" name="apprehending_officer" value={form.apprehending_officer} onChange={handleField} />

                  {formError   && <p className={styles.formError}>{formError}</p>}
                  {formSuccess && <p className={styles.formSuccess}>{formSuccess}</p>}

                  <div className={styles.panelActions}>
                    <button className={styles.btnSave} onClick={handleSubmit} disabled={submitting}>
                      {submitting ? "Saving…" : "Save"}
                    </button>
                    <button className={styles.btnCancel} onClick={mode === "edit" ? () => openView(selected) : closePanel}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Modal ── */}
      {deleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Delete Violation?</h3>
            <p className={styles.modalBody}>
              Permanently delete ticket <strong>#{deleteConfirm}</strong>?{" "}
              <strong>This cannot be undone.</strong> Consider archiving instead.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnDelete} onClick={() => handleDelete(deleteConfirm)}>Yes, Delete</button>
              <button className={styles.btnCancel} onClick={() => setDeleteConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Archive / Restore Modal ── */}
      {archiveConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>
              {showArchived ? "Restore Violation?" : "Archive Violation?"}
            </h3>
            <p className={styles.modalBody}>
              {showArchived
                ? <>Restore ticket <strong>#{archiveConfirm.violation_ticket_id}</strong> back to active?</>
                : <>Archive ticket <strong>#{archiveConfirm.violation_ticket_id}</strong>? It can be restored later.</>
              }
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnArchive} onClick={() => handleArchive(archiveConfirm.violation_ticket_id)}>
                {showArchived ? "Yes, Restore" : "Yes, Archive"}
              </button>
              <button className={styles.btnCancel} onClick={() => setArchiveConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, mono, children }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      {children ?? (
        <span className={`${styles.detailValue} ${mono ? styles.mono : ""}`}>{value ?? "—"}</span>
      )}
    </div>
  );
}

function FormField({ label, name, value, onChange, type = "text", disabled = false }) {
  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>{label}</label>
      <input className={styles.formInput} type={type} name={name} value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function FormSelect({ label, name, value, onChange, options }) {
  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>{label}</label>
      <select className={styles.formSelect} name={name} value={value} onChange={onChange}>
        <option value="">— Select —</option>
        {options.map((o) => {
          const val = typeof o === "object" ? o.value : o;
          const lbl = typeof o === "object" ? o.label : o;
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>
    </div>
  );
}