import { useEffect, useState, useCallback } from "react";
import styles from "../styles/Drivers.module.css";

const API = "http://localhost:3000/api/drivers";

const EMPTY_FORM = {
  license_number: "",
  full_name: "",
  sex: "",
  date_of_birth: "",
  barangay: "",
  city: "",
  province: "",
  region: "",
  license_type: "",
  license_status: "",
  license_issuance_date: "",
  license_expiration_date: "",
};

const LICENSE_TYPES = ["Student Permit", "Non-Professional", "Professional"];
const LICENSE_STATUSES = ["valid", "expired", "suspended", "revoked"];
const SEX_OPTIONS = ["M", "F"];

const SORT_OPTIONS = [
  { value: "full_name",               label: "Name" },
  { value: "license_expiration_date", label: "Expiry Date" },
  { value: "license_issuance_date",   label: "Issuance Date" },
  { value: "date_of_birth",           label: "Date of Birth" },
];

export default function Drivers() {
  const [tab, setTab] = useState("active");
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("view");
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // filter, sort, search
  const [search, setSearch]           = useState("");
  const [filterType, setFilterType]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSex, setFilterSex]     = useState("");
  const [sortBy, setSortBy]           = useState("");
  const [order, setOrder]             = useState("asc");

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // fetch
  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const isArchived = tab === "archived";
      const params = new URLSearchParams();
      if (sortBy) params.set("sortBy", sortBy);
      if (sortBy) params.set("order", order);

      let url;
      if (search.trim()) {
        // search endpoint
        params.set("keyword", search.trim());
        params.set("archived", String(isArchived));
        url = `${API}/search?${params}`;
      } else if (filterType || filterStatus || filterSex) {
        // use report endpoints for filter-only (active tab only)
        // for archived tab with filters we fall back to archived list
        if (isArchived) {
          url = `${API}/archived?${params}`;
        } else if (filterStatus) {
          params.set("status", filterStatus);
          url = `${API}/reports/status?${params}`;
        } else if (filterType) {
          params.set("type", filterType);
          url = `${API}/reports/license-type?${params}`;
        } else if (filterSex) {
          params.set("sex", filterSex);
          url = `${API}/reports/sex?${params}`;
        }
      } else {
        url = isArchived ? `${API}/archived?${params}` : `${API}?${params}`;
      }

      const res = await fetch(url);
      if (res.status === 404) { setDrivers([]); return; }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setDrivers(Array.isArray(data) ? data : data.result ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab, search, filterType, filterStatus, filterSex, sortBy, order]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  useEffect(() => {
    setSelected(null);
    setMode("view");
    setForm(EMPTY_FORM);
    setFormError("");
    setFormSuccess("");
  }, [tab]);

  const clearFilters = () => {
    setSearch("");
    setFilterType("");
    setFilterStatus("");
    setFilterSex("");
    setSortBy("");
    setOrder("asc");
  };

  const hasActiveFilters = search || filterType || filterStatus || filterSex || sortBy;

  // form helpers
  const openAdd = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setMode("add");
    setFormError("");
    setFormSuccess("");
  };

  const openEdit = (driver) => {
    setSelected(driver);
    setForm({
      license_number: driver.license_number,
      full_name: driver.full_name,
      sex: driver.sex,
      date_of_birth: driver.date_of_birth?.slice(0, 10) ?? "",
      barangay: driver.barangay,
      city: driver.city,
      province: driver.province,
      region: driver.region,
      license_type: driver.license_type,
      license_status: driver.license_status,
      license_issuance_date: driver.license_issuance_date?.slice(0, 10) ?? "",
      license_expiration_date: driver.license_expiration_date?.slice(0, 10) ?? "",
    });
    setMode("edit");
    setFormError("");
    setFormSuccess("");
  };

  const openView = (driver) => {
    setSelected(driver);
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

  const handleField = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // submit
  const handleSubmit = async () => {
    setFormError("");
    setFormSuccess("");
    setSubmitting(true);
    try {
      let res;
      if (mode === "add") {
        res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch(`${API}/${selected.license_number}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");
      setFormSuccess(mode === "add" ? "Driver added successfully." : "Driver updated successfully.");
      fetchDrivers();
      if (mode === "add") closePanel();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // archive / unarchive
  const handleArchive = async (license_number) => {
    try {
      const endpoint = tab === "active"
        ? `${API}/archive/${license_number}`
        : `${API}/unarchive/${license_number}`;
      const res = await fetch(endpoint, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed");
      fetchDrivers();
      closePanel();
    } catch (e) {
      setFormError(e.message);
    }
  };

  // hard delete 
  const handleDelete = async (license_number) => {
    try {
      const res = await fetch(`${API}/${license_number}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setDeleteConfirm(null);
      fetchDrivers();
      closePanel();
    } catch (e) {
      setFormError(e.message);
    }
  };

  const statusClass = (status) => {
    if (!status) return "";
    const s = status.toLowerCase();
    if (s === "valid") return styles.statusValid;
    if (s === "expired") return styles.statusExpired;
    if (s === "suspended") return styles.statusSuspended;
    if (s === "revoked") return styles.statusRevoked;
    return "";
  };

  const panelOpen = mode === "add" || selected !== null;

  return (
    <div className={styles.page}>
      {/* header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Driver Management</h1>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === "active" ? styles.tabActive : ""}`}
              onClick={() => setTab("active")}
            >Active</button>
            <button
              className={`${styles.tab} ${tab === "archived" ? styles.tabActive : ""}`}
              onClick={() => setTab("archived")}
            >Archived</button>
          </div>
        </div>
        <div className={styles.headerRight}>
          <input
            className={styles.search}
            placeholder="Search by name, license #, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {tab === "active" && (
            <button className={styles.btnAdd} onClick={openAdd}>+ Add Driver</button>
          )}
        </div>
      </div>

      {/* filter & sort bar */}
      <div className={styles.filterBar}>
        {tab === "active" && (
          <>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>License Type</label>
              <select
                className={styles.filterSelect}
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setFilterStatus(""); setFilterSex(""); }}
              >
                <option value="">All Types</option>
                {LICENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Status</label>
              <select
                className={styles.filterSelect}
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setFilterType(""); setFilterSex(""); }}
              >
                <option value="">All Statuses</option>
                {LICENSE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Sex</label>
              <select
                className={styles.filterSelect}
                value={filterSex}
                onChange={(e) => { setFilterSex(e.target.value); setFilterType(""); setFilterStatus(""); }}
              >
                <option value="">All</option>
                {SEX_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </>
        )}
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
          <button className={styles.btnClearFilters} onClick={clearFilters}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* body, table & panel */}
      <div className={`${styles.body} ${panelOpen ? styles.bodyWithPanel : ""}`}>

        {/* table */}
        <div className={styles.tableWrap}>
          {error && <div className={styles.errorBanner}>{error}</div>}
          {loading ? (
            <div className={styles.empty}>Loading…</div>
          ) : drivers.length === 0 ? (
            <div className={styles.empty}>No drivers found.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>License #</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Expiry</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr
                    key={d.license_number}
                    className={selected?.license_number === d.license_number ? styles.rowSelected : ""}
                    onClick={() => openView(d)}
                  >
                    <td className={styles.nameCell}>{d.full_name}</td>
                    <td className={styles.mono}>{d.license_number}</td>
                    <td>{d.license_type}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${statusClass(d.license_status)}`}>
                        {d.license_status}
                      </span>
                    </td>
                    <td>{d.license_expiration_date?.slice(0, 10) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* side panel */}
        {panelOpen && (
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>
                {mode === "add" ? "Add New Driver" : mode === "edit" ? "Edit Driver" : "Driver Details"}
              </span>
              <button className={styles.closeBtn} onClick={closePanel} aria-label="Close panel">✕</button>
            </div>

            <div className={styles.panelBody}>
              {mode === "view" && selected && (
                <>
                  <DetailRow label="Full Name" value={selected.full_name} />
                  <DetailRow label="License #" value={selected.license_number} mono />
                  <DetailRow label="Sex" value={selected.sex} />
                  <DetailRow label="Date of Birth" value={selected.date_of_birth?.slice(0, 10)} />
                  <DetailRow label="Barangay" value={selected.barangay} />
                  <DetailRow label="City" value={selected.city} />
                  <DetailRow label="Province" value={selected.province} />
                  <DetailRow label="Region" value={selected.region} />
                  <DetailRow label="License Type" value={selected.license_type} />
                  <DetailRow label="License Status">
                    <span className={`${styles.statusBadge} ${statusClass(selected.license_status)}`}>
                      {selected.license_status}
                    </span>
                  </DetailRow>
                  <DetailRow label="Issuance Date" value={selected.license_issuance_date?.slice(0, 10)} />
                  <DetailRow label="Expiration Date" value={selected.license_expiration_date?.slice(0, 10)} />

                  <div className={styles.panelActions}>
                    {tab === "active" && (
                      <button className={styles.btnEdit} onClick={() => openEdit(selected)}>Edit</button>
                    )}
                    <button
                      className={styles.btnArchive}
                      onClick={() => handleArchive(selected.license_number)}
                    >
                      {tab === "active" ? "Archive" : "Unarchive"}
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

              {(mode === "add" || mode === "edit") && (
                <>
                  <FormField label="Full Name" name="full_name" value={form.full_name} onChange={handleField} />
                  <FormField
                    label="License Number"
                    name="license_number"
                    value={form.license_number}
                    onChange={handleField}
                    disabled={mode === "edit"}
                  />
                  <FormSelect label="Sex" name="sex" value={form.sex} onChange={handleField} options={SEX_OPTIONS} />
                  <FormField label="Date of Birth" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleField} />
                  <FormField label="Barangay" name="barangay" value={form.barangay} onChange={handleField} />
                  <FormField label="City" name="city" value={form.city} onChange={handleField} />
                  <FormField label="Province" name="province" value={form.province} onChange={handleField} />
                  <FormField label="Region" name="region" value={form.region} onChange={handleField} />
                  <FormSelect label="License Type" name="license_type" value={form.license_type} onChange={handleField} options={LICENSE_TYPES} />
                  <FormSelect label="License Status" name="license_status" value={form.license_status} onChange={handleField} options={LICENSE_STATUSES} />
                  <FormField label="Issuance Date" name="license_issuance_date" type="date" value={form.license_issuance_date} onChange={handleField} />
                  <FormField label="Expiration Date" name="license_expiration_date" type="date" value={form.license_expiration_date} onChange={handleField} />

                  {formError && <p className={styles.formError}>{formError}</p>}
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

      {/* hard delete confirmation modal */}
      {deleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Permanently Delete Driver?</h3>
            <p className={styles.modalBody}>
              This will permanently remove all records for license <strong>{deleteConfirm}</strong>. This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnDelete} onClick={() => handleDelete(deleteConfirm)}>
                Yes, Delete Permanently
              </button>
              <button className={styles.btnCancel} onClick={() => setDeleteConfirm(null)}>
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
      {children ?? <span className={`${styles.detailValue} ${mono ? styles.mono : ""}`}>{value ?? "—"}</span>}
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
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}