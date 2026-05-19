import { useEffect, useState, useCallback } from "react";
import styles from "../styles/Drivers.module.css";

// ── API base — Vite proxy forwards /api → localhost:3000
const API = "/api/drivers";

// ── Dropdown options (values must match DB exactly)
const LICENSE_TYPES    = ["student permit", "non-professional", "professional"];
const LICENSE_STATUSES = ["valid", "expired", "suspended", "revoked"];

// Sex uses objects so we can show "Male"/"Female" in the UI
// but send "M"/"F" to the backend (matching what the DB stores)
const SEX_OPTIONS = [
  { value: "M", label: "Male"   },
  { value: "F", label: "Female" },
];

const SORT_OPTIONS = [
  { value: "full_name",               label: "Full Name"     },
  { value: "license_expiration_date", label: "Expiry Date"   },
  { value: "date_of_birth",           label: "Date of Birth" },
  { value: "license_type",            label: "License Type"  },
  { value: "license_status",          label: "License Status"},
];

// ── Blank form — field names match DB columns exactly
const EMPTY_FORM = {
  license_number:          "",
  full_name:               "",
  sex:                     "",
  date_of_birth:           "",
  barangay:                "",
  city:                    "",
  province:                "",
  region:                  "",
  license_type:            "",
  license_status:          "",
  license_issuance_date:   "",
  license_expiration_date: "",
};

// ── Converts "M"/"F" from DB into readable "Male"/"Female" for display
const formatSex = (s) =>
  s === "M" ? "Male" : s === "F" ? "Female" : s ?? "—";

// ════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════
export default function Drivers() {
  // ── data & UI state
  const [drivers, setDrivers]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // ── side panel state
  const [selected, setSelected] = useState(null);   // currently viewed driver
  const [mode, setMode]         = useState("view"); // "view" | "add" | "edit"
  const [form, setForm]         = useState(EMPTY_FORM);
  const [formError, setFormError]     = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting]   = useState(false);

  // ── filter / search / sort state
  const [search, setSearch]             = useState("");
  const [filterType, setFilterType]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSex, setFilterSex]       = useState("");
  const [sortBy, setSortBy]             = useState("");
  const [order, setOrder]               = useState("asc");

  // ── archive view toggle
  const [showArchived, setShowArchived] = useState(false);

  // ── confirmation modals
  const [deleteConfirm, setDeleteConfirm]   = useState(null); // license_number string
  const [archiveConfirm, setArchiveConfirm] = useState(null); // full driver object
  const [renewConfirm, setRenewConfirm]     = useState(null); // full driver object

  // ════════════════════════════════════════════════════
  //  FETCH DRIVERS
  //  Rebuilds and re-fetches whenever any filter changes
  // ════════════════════════════════════════════════════
  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();

      // Append sort params when a column is chosen
      if (sortBy) {
        params.set("sortBy", sortBy);
        params.set("order", order);
      }

      let url;
      const hasFilters = filterType || filterStatus || filterSex;
      const hasSearch  = search.trim();

      if (hasSearch || hasFilters) {
        // /api/drivers/search handles keyword + all filters + archive flag
        if (hasSearch)    params.set("keyword", search.trim());
        if (filterType)   params.set("type",    filterType);
        if (filterStatus) params.set("status",  filterStatus);
        if (filterSex)    params.set("sex",      filterSex);  // sends "M" or "F"

        // Tell backend whether to search archived or active records
        params.set("isArchived", showArchived ? "true" : "false");

        url = `${API}/search?${params}`;
      } else if (showArchived) {
        // /api/drivers/archived — no filters, just archived list
        url = `${API}/archived?${params}`;
      } else {
        // /api/drivers — default active driver listing
        url = `${API}?${params}`;
      }

      const res = await fetch(url);

      // 404 = no records — not a real error, just empty
      if (res.status === 404) { setDrivers([]); return; }
      if (!res.ok) throw new Error("Failed to fetch drivers");

      const data = await res.json();
      setDrivers(Array.isArray(data) ? data : data.result ?? []);

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, filterType, filterStatus, filterSex, showArchived, sortBy, order]);

  // Re-fetch whenever any dependency changes
  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  // ════════════════════════════════════════════════════
  //  FILTER HELPERS
  // ════════════════════════════════════════════════════
  const clearFilters = () => {
    setSearch("");
    setFilterType("");
    setFilterStatus("");
    setFilterSex("");
    setSortBy("");
    setOrder("asc");
  };

  const hasActiveFilters = search || filterType || filterStatus || filterSex || sortBy;

  // ════════════════════════════════════════════════════
  //  PANEL HELPERS
  // ════════════════════════════════════════════════════
  const openAdd = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setMode("add");
    setFormError("");
    setFormSuccess("");
  };

  const openEdit = (d) => {
    setSelected(d);
    setForm({
      license_number:          d.license_number,
      full_name:               d.full_name,
      sex:                     d.sex,
      date_of_birth:           d.date_of_birth?.slice(0, 10) ?? "",
      barangay:                d.barangay  ?? "",
      city:                    d.city      ?? "",
      province:                d.province  ?? "",
      region:                  d.region    ?? "",
      license_type:            d.license_type,
      license_status:          d.license_status,
      license_issuance_date:   d.license_issuance_date?.slice(0, 10)   ?? "",
      license_expiration_date: d.license_expiration_date?.slice(0, 10) ?? "",
    });
    setMode("edit");
    setFormError("");
    setFormSuccess("");
  };

  const openView = (d) => {
    setSelected(d);
    setMode("view");
    setFormError("");
    setFormSuccess("");
  };

  const closePanel = () => {
    setSelected(null);
    setMode("view");
    setForm(EMPTY_FORM);
    setFormError("");
    setFormSuccess("");
  };

  // Updates only the changed field in form state
  const handleField = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // ════════════════════════════════════════════════════
  //  CRUD HANDLERS
  // ════════════════════════════════════════════════════
  const handleSubmit = async () => {
    setFormError("");
    setFormSuccess("");
    setSubmitting(true);
    try {
      let res;
      if (mode === "add") {
        // POST /api/drivers — create new driver
        res = await fetch(API, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(form),
        });
      } else {
        // PATCH /api/drivers/:license_number — update existing
        // Strip license_number from body — backend reads it from req.params
        const { license_number, ...updateData } = form;
        res = await fetch(`${API}/${selected.license_number}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(updateData),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");

      setFormSuccess(mode === "add" ? "Driver added successfully." : "Driver updated.");
      fetchDrivers();
      if (mode === "add") closePanel();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE /api/drivers/:license_number — permanent hard delete
  const handleDelete = async (licenseNumber) => {
    try {
      const res  = await fetch(`${API}/${licenseNumber}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete driver");
      setDeleteConfirm(null);
      fetchDrivers();
      closePanel();
    } catch (e) {
      setFormError(e.message);
    }
  };

  // PATCH /api/drivers/archive/:id   — soft delete
  // PATCH /api/drivers/unarchive/:id — restore
  const handleArchive = async (licenseNumber) => {
    try {
      const endpoint = showArchived
        ? `${API}/unarchive/${licenseNumber}`
        : `${API}/archive/${licenseNumber}`;

      const res  = await fetch(endpoint, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update archive status");

      setArchiveConfirm(null);
      fetchDrivers();
      closePanel();
    } catch (e) {
      setFormError(e.message);
    }
  };

  // PATCH /api/drivers/renew/:license_number — renew license dates
  const handleRenew = async (licenseNumber) => {
    try {
      const res  = await fetch(`${API}/renew/${licenseNumber}`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to renew license");

      setRenewConfirm(null);
      fetchDrivers();
      if (selected?.license_number === licenseNumber) {
        openView({ ...selected, ...data });
      }
    } catch (e) {
      setFormError(e.message);
    }
  };

  // ════════════════════════════════════════════════════
  //  STATUS BADGE COLOR HELPER
  // ════════════════════════════════════════════════════
  const statusClass = (s) => {
    if (!s) return "";
    if (s === "valid")     return styles.statusValid;
    if (s === "expired")   return styles.statusExpired;
    if (s === "suspended") return styles.statusSuspended;
    if (s === "revoked")   return styles.statusRevoked;
    return "";
  };

  const panelOpen = mode === "add" || selected !== null;

  // ════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════
  return (
    <div className={styles.page}>

      {/* ── Page Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>
            {showArchived ? "Archived Drivers" : "Driver Management"}
          </h1>
        </div>
        <div className={styles.headerRight}>
          <input
            className={styles.search}
            placeholder="Search by name, license #, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Archive view toggle */}
          <button
            className={showArchived ? styles.btnArchive : styles.btnCancel}
            onClick={() => {
              setShowArchived((v) => !v);
              closePanel();
              clearFilters();
            }}
          >
            {showArchived ? "← Active Drivers" : "🗄 Archived"}
          </button>

          {/* Hide "Add Driver" when browsing archived list */}
          {!showArchived && (
            <button className={styles.btnAdd} onClick={openAdd}>
              + Add Driver
            </button>
          )}
        </div>
      </div>

      {/* ── Filter / Sort Bar ── */}
      <div className={styles.filterBar}>

        {/* License Type */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>License Type</label>
          <select
            className={styles.filterSelect}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            {LICENSE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* License Status */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>License Status</label>
          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {LICENSE_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Sex — value is "M"/"F", label is "Male"/"Female" */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Sex</label>
          <select
            className={styles.filterSelect}
            value={filterSex}
            onChange={(e) => setFilterSex(e.target.value)}
          >
            <option value="">All</option>
            {SEX_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Sort By</label>
          <select
            className={styles.filterSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="">Default</option>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Asc / Desc — only visible when a sort column is chosen */}
        {sortBy && (
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Order</label>
            <div className={styles.orderToggle}>
              <button
                className={`${styles.orderBtn} ${order === "asc" ? styles.orderActive : ""}`}
                onClick={() => setOrder("asc")}
              >
                ↑ Asc
              </button>
              <button
                className={`${styles.orderBtn} ${order === "desc" ? styles.orderActive : ""}`}
                onClick={() => setOrder("desc")}
              >
                ↓ Desc
              </button>
            </div>
          </div>
        )}

        {/* Clear all filters — only shown when something is active */}
        {hasActiveFilters && (
          <button className={styles.btnClearFilters} onClick={clearFilters}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Body: Table + Side Panel ── */}
      <div className={`${styles.body} ${panelOpen ? styles.bodyWithPanel : ""}`}>

        {/* ── Drivers Table ── */}
        <div className={styles.tableWrap}>
          {error && <div className={styles.errorBanner}>{error}</div>}

          {loading ? (
            <div className={styles.empty}>Loading…</div>
          ) : drivers.length === 0 ? (
            <div className={styles.empty}>
              {showArchived ? "No archived drivers found." : "No drivers found."}
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>License #</th>
                  <th>Full Name</th>
                  <th>Sex</th>
                  <th>License Type</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr
                    key={d.license_number}
                    className={
                      selected?.license_number === d.license_number
                        ? styles.rowSelected : ""
                    }
                    onClick={() => openView(d)}
                  >
                    <td className={`${styles.nameCell} ${styles.mono}`}>
                      {d.license_number}
                    </td>
                    <td className={styles.nameCell}>{d.full_name}</td>
                    {/* formatSex converts "M" → "Male", "F" → "Female" */}
                    <td>{formatSex(d.sex)}</td>
                    <td>{d.license_type}</td>
                    <td>{d.license_expiration_date?.slice(0, 10)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${statusClass(d.license_status)}`}>
                        {d.license_status}
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
                {mode === "add"  ? "Add Driver"    :
                 mode === "edit" ? "Edit Driver"   :
                                   "Driver Details"}
              </span>
              <button className={styles.closeBtn} onClick={closePanel}>✕</button>
            </div>

            <div className={styles.panelBody}>

              {/* ── VIEW mode ── */}
              {mode === "view" && selected && (
                <>
                  <DetailRow label="License #"     value={selected.license_number} mono />
                  <DetailRow label="Full Name"     value={selected.full_name} />
                  {/* formatSex so panel shows "Male"/"Female" not "M"/"F" */}
                  <DetailRow label="Sex"           value={formatSex(selected.sex)} />
                  <DetailRow label="Date of Birth" value={selected.date_of_birth?.slice(0, 10)} />
                  <DetailRow label="Barangay"      value={selected.barangay} />
                  <DetailRow label="City"          value={selected.city} />
                  <DetailRow label="Province"      value={selected.province} />
                  <DetailRow label="Region"        value={selected.region} />
                  <DetailRow label="License Type"  value={selected.license_type} />
                  <DetailRow label="Issued"        value={selected.license_issuance_date?.slice(0, 10)} />
                  <DetailRow label="Expires"       value={selected.license_expiration_date?.slice(0, 10)} />
                  <DetailRow label="Status">
                    <span className={`${styles.statusBadge} ${statusClass(selected.license_status)}`}>
                      {selected.license_status}
                    </span>
                  </DetailRow>

                  {formError && <p className={styles.formError}>{formError}</p>}

                  <div className={styles.panelActions}>
                    {!showArchived && (
                      <>
                        <button
                          className={styles.btnEdit}
                          onClick={() => openEdit(selected)}
                        >
                          Edit
                        </button>
                        <button
                          className={styles.btnSave}
                          onClick={() => setRenewConfirm(selected)}
                        >
                          Renew
                        </button>
                      </>
                    )}
                    <button
                      className={styles.btnArchive}
                      onClick={() => setArchiveConfirm(selected)}
                    >
                      {showArchived ? "Restore" : "Archive"}
                    </button>
                    <button
                      className={styles.btnDelete}
                      onClick={() => setDeleteConfirm(selected.license_number)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}

              {/* ── ADD / EDIT mode ── */}
              {(mode === "add" || mode === "edit") && (
                <>
                  <FormField
                    label="License # (leave blank to auto-generate)"
                    name="license_number"
                    value={form.license_number}
                    onChange={handleField}
                    disabled={mode === "edit"}
                  />
                  <FormField  label="Full Name"     name="full_name"     value={form.full_name}     onChange={handleField} />
                  {/* Sex dropdown sends "M"/"F" but displays "Male"/"Female" */}
                  <FormSelect label="Sex"           name="sex"           value={form.sex}           onChange={handleField} options={SEX_OPTIONS} />
                  <FormField  label="Date of Birth" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleField} />
                  <FormField  label="Barangay"      name="barangay"      value={form.barangay}      onChange={handleField} />
                  <FormField  label="City"          name="city"          value={form.city}          onChange={handleField} />
                  <FormField  label="Province"      name="province"      value={form.province}      onChange={handleField} />
                  <FormField  label="Region"        name="region"        value={form.region}        onChange={handleField} />
                  <FormSelect label="License Type"   name="license_type"            value={form.license_type}            onChange={handleField} options={LICENSE_TYPES} />
                  <FormSelect label="License Status" name="license_status"          value={form.license_status}          onChange={handleField} options={LICENSE_STATUSES} />
                  <FormField  label="Issuance Date"   name="license_issuance_date"   type="date" value={form.license_issuance_date}   onChange={handleField} />
                  <FormField  label="Expiration Date" name="license_expiration_date" type="date" value={form.license_expiration_date} onChange={handleField} />

                  {formError   && <p className={styles.formError}>{formError}</p>}
                  {formSuccess && <p className={styles.formSuccess}>{formSuccess}</p>}

                  <div className={styles.panelActions}>
                    <button
                      className={styles.btnSave}
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? "Saving…" : "Save"}
                    </button>
                    <button
                      className={styles.btnCancel}
                      onClick={mode === "edit" ? () => openView(selected) : closePanel}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          CONFIRMATION MODALS
      ══════════════════════════════════════════ */}

      {/* ── Delete Modal ── */}
      {deleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Delete Driver?</h3>
            <p className={styles.modalBody}>
              Permanently delete driver <strong>{deleteConfirm}</strong>?{" "}
              <strong>This cannot be undone.</strong> Consider archiving instead.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.btnDelete}
                onClick={() => handleDelete(deleteConfirm)}
              >
                Yes, Delete
              </button>
              <button
                className={styles.btnCancel}
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Archive / Restore Modal ── */}
      {archiveConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>
              {showArchived ? "Restore Driver?" : "Archive Driver?"}
            </h3>
            <p className={styles.modalBody}>
              {showArchived ? (
                <>Restore <strong>{archiveConfirm.full_name}</strong> back to active drivers?</>
              ) : (
                <>
                  Archive <strong>{archiveConfirm.full_name}</strong>?{" "}
                  They will be hidden from the active list but can be restored later.
                </>
              )}
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.btnArchive}
                onClick={() => handleArchive(archiveConfirm.license_number)}
              >
                {showArchived ? "Yes, Restore" : "Yes, Archive"}
              </button>
              <button
                className={styles.btnCancel}
                onClick={() => setArchiveConfirm(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Renew License Modal ── */}
      {renewConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Renew Driver License?</h3>
            <p className={styles.modalBody}>
              Renew the license for <strong>{renewConfirm.full_name}</strong>?
              <br /><br />
              Current expiry:{" "}
              <strong>{renewConfirm.license_expiration_date?.slice(0, 10)}</strong>
              <br /><br />
              Note: Renewal is only allowed within 60 days before expiration.
              Drivers with unpaid violations receive a 5-year renewal; clean
              drivers receive 10 years.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.btnSave}
                onClick={() => handleRenew(renewConfirm.license_number)}
              >
                Yes, Renew
              </button>
              <button
                className={styles.btnCancel}
                onClick={() => setRenewConfirm(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  REUSABLE SUB-COMPONENTS
// ════════════════════════════════════════════════════════════

// DetailRow — one labelled read-only field in the view panel
// Pass `value` for plain text, or `children` for custom content (e.g. a badge)
function DetailRow({ label, value, mono, children }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      {children ?? (
        <span className={`${styles.detailValue} ${mono ? styles.mono : ""}`}>
          {value ?? "—"}
        </span>
      )}
    </div>
  );
}

// FormField — labelled text / date / number input
// `disabled` keeps the license_number field read-only in edit mode
function FormField({ label, name, value, onChange, type = "text", disabled = false }) {
  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>{label}</label>
      <input
        className={styles.formInput}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

// FormSelect — labelled dropdown
// Supports both plain strings ("valid") AND objects ({ value: "M", label: "Male" })
function FormSelect({ label, name, value, onChange, options }) {
  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>{label}</label>
      <select
        className={styles.formSelect}
        name={name}
        value={value}
        onChange={onChange}
      >
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