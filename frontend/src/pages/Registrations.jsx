import { useEffect, useState, useCallback } from "react";
import styles from "../styles/Drivers.module.css";

const API = "http://localhost:3000/api/registrations";

const EMPTY_FORM = {
  MV_number: "",
  registration_date: "",
  expiration_date: "",
  registration_status: "",
};

const REG_STATUSES = ["active", "expired", "suspended", "revoked"];

const SORT_OPTIONS = [
  { value: "registration_date",   label: "Reg Date" },
  { value: "expiration_date",     label: "Expiry Date" },
  { value: "registration_number", label: "Reg #" },
];

export default function Registrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");

  const [selected, setSelected]       = useState(null);
  const [mode, setMode]               = useState("view");
  const [form, setForm]               = useState(EMPTY_FORM);
  const [formError, setFormError]     = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting]   = useState(false);

  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy]             = useState("");
  const [order, setOrder]               = useState("desc");

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [renewConfirm, setRenewConfirm]   = useState(null);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (sortBy) { params.set("sortBy", sortBy); params.set("order", order); }

      let url;
      if (search.trim() || filterStatus) {
        if (search.trim()) params.set("keyword", search.trim());
        if (filterStatus)  params.set("status", filterStatus);
        url = `${API}/search?${params}`;
      } else {
        url = `${API}?${params}`;
      }

      const res = await fetch(url);
      if (res.status === 404) { setRegistrations([]); return; }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRegistrations(Array.isArray(data) ? data : data.result ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, sortBy, order]);

  useEffect(() => { fetchRegistrations(); }, [fetchRegistrations]);

  const clearFilters = () => {
    setSearch(""); setFilterStatus(""); setSortBy(""); setOrder("desc");
  };
  const hasActiveFilters = search || filterStatus || sortBy;

  const openAdd = () => {
    setSelected(null); setForm(EMPTY_FORM);
    setMode("add"); setFormError(""); setFormSuccess("");
  };

  const openEdit = (r) => {
    setSelected(r);
    setForm({
      MV_number:           r.MV_number,
      registration_date:   r.registration_date?.slice(0, 10) ?? "",
      expiration_date:     r.expiration_date?.slice(0, 10) ?? "",
      registration_status: r.registration_status,
    });
    setMode("edit"); setFormError(""); setFormSuccess("");
  };

  const openView   = (r) => { setSelected(r); setMode("view"); setFormError(""); setFormSuccess(""); };
  const closePanel = () => { setSelected(null); setMode("view"); setForm(EMPTY_FORM); setFormError(""); setFormSuccess(""); };
  const handleField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    setFormError(""); setFormSuccess(""); setSubmitting(true);
    try {
      let res;
      if (mode === "add") {
        res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch(`${API}/${selected.registration_number}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");
      setFormSuccess(mode === "add" ? "Registration added." : "Registration updated.");
      fetchRegistrations();
      if (mode === "add") closePanel();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (registration_number) => {
    try {
      const res = await fetch(`${API}/${registration_number}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setDeleteConfirm(null); fetchRegistrations(); closePanel();
    } catch (e) { setFormError(e.message); }
  };

  const handleRenew = async (MV_number) => {
    setFormError(""); setFormSuccess(""); setSubmitting(true);
    try {
      const res = await fetch(`${API}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ MV_number }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Renewal failed");
      setRenewConfirm(null);
      fetchRegistrations();
      closePanel();
    } catch (e) {
      setRenewConfirm(null);
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const statusClass = (s) => {
    if (s === "active")    return styles.statusValid;
    if (s === "expired")   return styles.statusExpired;
    if (s === "suspended") return styles.statusSuspended;
    if (s === "revoked")   return styles.statusRevoked;
    return "";
  };

  const panelOpen = mode === "add" || selected !== null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Vehicle Registration</h1>
        </div>
        <div className={styles.headerRight}>
          <input
            className={styles.search}
            placeholder="Search by reg #, MV number, plate…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className={styles.btnAdd} onClick={openAdd}>+ Add Registration</button>
        </div>
      </div>

      {/* Filter / Sort Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status</label>
          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {REG_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
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
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        {sortBy && (
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Order</label>
            <div className={styles.orderToggle}>
              <button
                className={`${styles.orderBtn} ${order === "asc" ? styles.orderActive : ""}`}
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

      <div className={`${styles.body} ${panelOpen ? styles.bodyWithPanel : ""}`}>
        <div className={styles.tableWrap}>
          {error && <div className={styles.errorBanner}>{error}</div>}
          {loading ? (
            <div className={styles.empty}>Loading…</div>
          ) : registrations.length === 0 ? (
            <div className={styles.empty}>No registrations found.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Reg #</th>
                  <th>MV Number</th>
                  <th>Plate #</th>
                  <th>Reg Date</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r) => (
                  <tr
                    key={r.registration_number}
                    className={selected?.registration_number === r.registration_number ? styles.rowSelected : ""}
                    onClick={() => openView(r)}
                  >
                    <td className={`${styles.nameCell} ${styles.mono}`}>{r.registration_number}</td>
                    <td className={styles.mono}>{r.MV_number}</td>
                    <td className={styles.mono}>{r.plate_number ?? "—"}</td>
                    <td>{r.registration_date?.slice(0, 10)}</td>
                    <td>{r.expiration_date?.slice(0, 10)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${statusClass(r.registration_status)}`}>
                        {r.registration_status}
                      </span>
                    </td>
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
                {mode === "add" ? "Add Registration" : mode === "edit" ? "Edit Registration" : "Registration Details"}
              </span>
              <button className={styles.closeBtn} onClick={closePanel}>✕</button>
            </div>
            <div className={styles.panelBody}>
              {mode === "view" && selected && (
                <>
                  <DetailRow label="Registration #"    value={selected.registration_number} mono />
                  <DetailRow label="MV Number"         value={selected.MV_number}           mono />
                  <DetailRow label="Plate #"           value={selected.plate_number ?? "—"} mono />
                  <DetailRow label="Registration Date" value={selected.registration_date?.slice(0, 10)} />
                  <DetailRow label="Expiration Date"   value={selected.expiration_date?.slice(0, 10)} />
                  <DetailRow label="Status">
                    <span className={`${styles.statusBadge} ${statusClass(selected.registration_status)}`}>
                      {selected.registration_status}
                    </span>
                  </DetailRow>
                  {formError && <p className={styles.formError}>{formError}</p>}
                  <div className={styles.panelActions}>
                    <button className={styles.btnEdit}   onClick={() => openEdit(selected)}>Edit</button>
                    <button className={styles.btnDelete} onClick={() => setDeleteConfirm(selected.registration_number)}>Delete</button>
                    {selected.registration_status === "expired" && (
                      <button className={styles.btnSave} onClick={() => setRenewConfirm(selected)}>
                        Renew
                      </button>
                    )}
                  </div>
                </>
              )}

              {(mode === "add" || mode === "edit") && (
                <>
                  <FormField
                    label="MV Number"
                    name="MV_number"
                    value={form.MV_number}
                    onChange={handleField}
                    disabled={mode === "edit"}
                  />
                  <FormField
                    label="Registration Date"
                    name="registration_date"
                    type="date"
                    value={form.registration_date}
                    onChange={handleField}
                  />
                  <FormField
                    label="Expiration Date"
                    name="expiration_date"
                    type="date"
                    value={form.expiration_date}
                    onChange={handleField}
                  />
                  <FormSelect
                    label="Status"
                    name="registration_status"
                    value={form.registration_status}
                    onChange={handleField}
                    options={REG_STATUSES}
                  />
                  {formError   && <p className={styles.formError}>{formError}</p>}
                  {formSuccess && <p className={styles.formSuccess}>{formSuccess}</p>}
                  <div className={styles.panelActions}>
                    <button className={styles.btnSave} onClick={handleSubmit} disabled={submitting}>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Delete Registration?</h3>
            <p className={styles.modalBody}>
              Permanently delete registration <strong>{deleteConfirm}</strong>? This cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnDelete} onClick={() => handleDelete(deleteConfirm)}>
                Yes, Delete
              </button>
              <button className={styles.btnCancel} onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renew Confirmation Modal */}
      {renewConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Renew Registration?</h3>
            <p className={styles.modalBody}>
              Renew registration for MV number <strong>{renewConfirm.MV_number}</strong>?
              A new active registration will be created from today with a 5-year expiry.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.btnSave}
                onClick={() => handleRenew(renewConfirm.MV_number)}
                disabled={submitting}
              >
                {submitting ? "Renewing…" : "Yes, Renew"}
              </button>
              <button className={styles.btnCancel} onClick={() => setRenewConfirm(null)}>
                Cancel
              </button>
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
        <span className={`${styles.detailValue} ${mono ? styles.mono : ""}`}>
          {value ?? "—"}
        </span>
      )}
    </div>
  );
}

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