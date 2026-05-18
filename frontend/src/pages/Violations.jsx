import { useEffect, useState, useCallback } from "react";
import styles from "../styles/Drivers.module.css";

const API = "http://localhost:3000/api/violations";

const EMPTY_FORM = {
  violation_id: "",
  plate_number: "",
  license_number: "",
  violation_type: "",
  violation_date: "",
  location: "",
  fine_amount: "",
  apprehending_officer: "",
  violation_status: "",
};

const VIOLATION_TYPES = ["Overspeeding", "Reckless Driving", "Illegal Parking", "Beating Red Light", "No Helmet", "No Seatbelt", "Drunk Driving", "Other"];
const VIOLATION_STATUSES = ["unpaid", "paid", "contested"];

const SORT_OPTIONS = [
  { value: "violation_date", label: "Date" },
  { value: "fine_amount",    label: "Fine Amount" },
  { value: "violation_type", label: "Type" },
  { value: "plate_number",   label: "Plate #" },
];

export default function Violations() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("view");
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  //filter, search, sort state
  const [search, setSearch]                 = useState("");
  const [filterStatus, setFilterStatus]     = useState("");
  const [filterType, setFilterType]         = useState("");
  const [sortBy, setSortBy]                 = useState("");
  const [order, setOrder]                   = useState("desc"); // default newest first

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchViolations = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      if (sortBy) { params.set("sortBy", sortBy); params.set("order", order); }

      let url;
      if (search.trim()) {
        params.set("keyword", search.trim());
        url = `${API}/search?${params}`;
      } else {
        if (filterStatus) params.set("status", filterStatus);
        if (filterType) params.set("type", filterType);
        url = `${API}?${params}`;
      }

      const res = await fetch(url);
      if (res.status === 404) { setViolations([]); return; }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      let list = Array.isArray(data) ? data : data.result ?? [];

      //client-side filter fallbacks
      if (filterStatus && !search.trim()) list = list.filter((v) => v.violation_status === filterStatus);
      if (filterType && !search.trim())   list = list.filter((v) => v.violation_type === filterType);

      setViolations(list);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [search, filterStatus, filterType, sortBy, order]);

  useEffect(() => { fetchViolations(); }, [fetchViolations]);

  const clearFilters = () => { setSearch(""); setFilterStatus(""); setFilterType(""); setSortBy(""); setOrder("desc"); };
  const hasActiveFilters = search || filterStatus || filterType || sortBy;

  const openAdd = () => { setSelected(null); setForm(EMPTY_FORM); setMode("add"); setFormError(""); setFormSuccess(""); };
  const openEdit = (v) => {
    setSelected(v);
    setForm({
      violation_id: v.violation_id,
      plate_number: v.plate_number,
      license_number: v.license_number,
      violation_type: v.violation_type,
      violation_date: v.violation_date?.slice(0, 10) ?? "",
      location: v.location,
      fine_amount: v.fine_amount?.toString() ?? "",
      apprehending_officer: v.apprehending_officer ?? "",
      violation_status: v.violation_status,
    });
    setMode("edit"); setFormError(""); setFormSuccess("");
  };
  const openView = (v) => { setSelected(v); setMode("view"); setFormError(""); setFormSuccess(""); };
  const closePanel = () => { setSelected(null); setMode("view"); setForm(EMPTY_FORM); setFormError(""); setFormSuccess(""); };
  const handleField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    setFormError(""); setFormSuccess(""); setSubmitting(true);
    try {
      let res;
      if (mode === "add") {
        res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      } else {
        res = await fetch(`${API}/${selected.violation_id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");
      setFormSuccess(mode === "add" ? "Violation recorded." : "Violation updated.");
      fetchViolations();
      if (mode === "add") closePanel();
    } catch (e) { setFormError(e.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setDeleteConfirm(null); fetchViolations(); closePanel();
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
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Traffic Violations</h1>
        </div>
        <div className={styles.headerRight}>
          <input className={styles.search} placeholder="Search by plate, license, type…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className={styles.btnAdd} onClick={openAdd}>+ Add Violation</button>
        </div>
      </div>

      {/* filter & sort bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status</label>
          <select className={styles.filterSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {VIOLATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Violation Type</label>
          <select className={styles.filterSelect} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {VIOLATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Sort By</label>
          <select className={styles.filterSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="">Default</option>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {sortBy && (
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Order</label>
            <div className={styles.orderToggle}>
              <button className={`${styles.orderBtn} ${order === "asc" ? styles.orderActive : ""}`} onClick={() => setOrder("asc")}>↑ Asc</button>
              <button className={`${styles.orderBtn} ${order === "desc" ? styles.orderActive : ""}`} onClick={() => setOrder("desc")}>↓ Desc</button>
            </div>
          </div>
        )}
        {hasActiveFilters && (
          <button className={styles.btnClearFilters} onClick={clearFilters}>✕ Clear</button>
        )}
      </div>

      <div className={`${styles.body} ${panelOpen ? styles.bodyWithPanel : ""}`}>
        <div className={styles.tableWrap}>
          {error && <div className={styles.errorBanner}>{error}</div>}
          {loading ? <div className={styles.empty}>Loading…</div>
            : violations.length === 0 ? <div className={styles.empty}>No violations found.</div>
            : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Plate #</th>
                    <th>License #</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Fine</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {violations.map((v) => (
                    <tr key={v.violation_id}
                      className={selected?.violation_id === v.violation_id ? styles.rowSelected : ""}
                      onClick={() => openView(v)}>
                      <td className={styles.mono}>{v.violation_id}</td>
                      <td className={styles.mono}>{v.plate_number}</td>
                      <td className={styles.mono}>{v.license_number}</td>
                      <td>{v.violation_type}</td>
                      <td>{v.violation_date?.slice(0, 10)}</td>
                      <td>₱{Number(v.fine_amount).toLocaleString()}</td>
                      <td><span className={`${styles.statusBadge} ${statusClass(v.violation_status)}`}>{v.violation_status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>

        {panelOpen && (
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>
                {mode === "add" ? "Record Violation" : mode === "edit" ? "Edit Violation" : "Violation Details"}
              </span>
              <button className={styles.closeBtn} onClick={closePanel}>✕</button>
            </div>
            <div className={styles.panelBody}>
              {mode === "view" && selected && (
                <>
                  <DetailRow label="Violation ID" value={selected.violation_id} mono />
                  <DetailRow label="Plate #" value={selected.plate_number} mono />
                  <DetailRow label="License #" value={selected.license_number} mono />
                  <DetailRow label="Violation Type" value={selected.violation_type} />
                  <DetailRow label="Date" value={selected.violation_date?.slice(0, 10)} />
                  <DetailRow label="Location" value={selected.location} />
                  <DetailRow label="Fine Amount" value={`₱${Number(selected.fine_amount).toLocaleString()}`} />
                  <DetailRow label="Officer" value={selected.apprehending_officer || "—"} />
                  <DetailRow label="Status">
                    <span className={`${styles.statusBadge} ${statusClass(selected.violation_status)}`}>{selected.violation_status}</span>
                  </DetailRow>
                  <div className={styles.panelActions}>
                    <button className={styles.btnEdit} onClick={() => openEdit(selected)}>Edit</button>
                    <button className={styles.btnDelete} onClick={() => setDeleteConfirm(selected.violation_id)}>Delete</button>
                  </div>
                </>
              )}
              {(mode === "add" || mode === "edit") && (
                <>
                  <FormField label="Plate #" name="plate_number" value={form.plate_number} onChange={handleField} />
                  <FormField label="License #" name="license_number" value={form.license_number} onChange={handleField} />
                  <FormSelect label="Violation Type" name="violation_type" value={form.violation_type} onChange={handleField} options={VIOLATION_TYPES} />
                  <FormField label="Date" name="violation_date" type="date" value={form.violation_date} onChange={handleField} />
                  <FormField label="Location" name="location" value={form.location} onChange={handleField} />
                  <FormField label="Fine Amount (₱)" name="fine_amount" type="number" value={form.fine_amount} onChange={handleField} />
                  <FormField label="Apprehending Officer (optional)" name="apprehending_officer" value={form.apprehending_officer} onChange={handleField} />
                  <FormSelect label="Status" name="violation_status" value={form.violation_status} onChange={handleField} options={VIOLATION_STATUSES} />
                  {formError && <p className={styles.formError}>{formError}</p>}
                  {formSuccess && <p className={styles.formSuccess}>{formSuccess}</p>}
                  <div className={styles.panelActions}>
                    <button className={styles.btnSave} onClick={handleSubmit} disabled={submitting}>{submitting ? "Saving…" : "Save"}</button>
                    <button className={styles.btnCancel} onClick={mode === "edit" ? () => openView(selected) : closePanel}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Delete Violation Record?</h3>
            <p className={styles.modalBody}>Permanently delete violation <strong>#{deleteConfirm}</strong>? This cannot be undone.</p>
            <div className={styles.modalActions}>
              <button className={styles.btnDelete} onClick={() => handleDelete(deleteConfirm)}>Yes, Delete</button>
              <button className={styles.btnCancel} onClick={() => setDeleteConfirm(null)}>Cancel</button>
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
      {children ?? <span className={`${styles.detailValue} ${mono ? styles.mono : ""}`}>{value ?? "—"}</span>}
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
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}