
import { useEffect, useState, useCallback } from "react";
import styles from "../styles/Drivers.module.css";

const API = "http://localhost:3000/api/vehicles";

const EMPTY_FORM = {
  plate_number: "",
  vehicle_type: "",
  engine_number: "",
  chassis_number: "",
  year: "",
  make: "",
  model: "",
  color: "",
  license_number: "",
};

const VEHICLE_TYPES = ["Motorcycle", "Private Car", "Public Utility Vehicle", "Truck", "Van", "Bus", "Other"];

const SORT_OPTIONS = [
  { value: "plate_number", label: "Plate #" },
  { value: "year",         label: "Year" },
  { value: "make",         label: "Make" },
  { value: "vehicle_type", label: "Type" },
];

export default function Vehicles() {
  const [tab, setTab] = useState("active");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("view");
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  //filter, search, sort state
  const [search, setSearch]               = useState("");
  const [filterType, setFilterType]       = useState("");
  const [sortBy, setSortBy]               = useState("");
  const [order, setOrder]                 = useState("asc");

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const isArchived = tab === "archived";
      const params = new URLSearchParams();
      if (sortBy) { params.set("sortBy", sortBy); params.set("order", order); }

      let url;
      if (search.trim()) {
        params.set("keyword", search.trim());
        params.set("archived", String(isArchived));
        url = `${API}/search?${params}`;
      } else {
        //vehicle type filter can be appended to base list
        if (filterType) params.set("type", filterType);
        url = isArchived ? `${API}/archived?${params}` : `${API}?${params}`;
      }

      const res = await fetch(url);
      if (res.status === 404) { setVehicles([]); return; }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      let list = Array.isArray(data) ? data : data.result ?? [];

      //client-side type filter fallback
     if (filterType) list = list.filter((v) => v.vehicle_type?.toLowerCase() === filterType.toLowerCase());

      setVehicles(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab, search, filterType, sortBy, order]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  useEffect(() => {
    setSelected(null); setMode("view");
    setForm(EMPTY_FORM); setFormError(""); setFormSuccess("");
  }, [tab]);

  const clearFilters = () => {
    setSearch(""); setFilterType(""); setSortBy(""); setOrder("asc");
  };
  const hasActiveFilters = search || filterType || sortBy;

  const openAdd = () => {
    setSelected(null); setForm(EMPTY_FORM);
    setMode("add"); setFormError(""); setFormSuccess("");
  };

  const openEdit = (v) => {
    setSelected(v);
    setForm({
      plate_number: v.plate_number,
      vehicle_type: v.vehicle_type,
      engine_number: v.engine_number,
      chassis_number: v.chassis_number,
      year: v.year?.toString() ?? "",
      make: v.make,
      model: v.model,
      color: v.color,
      license_number: v.license_number,
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
        res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch(`${API}/${selected.plate_number}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");
      setFormSuccess(mode === "add" ? "Vehicle added successfully." : "Vehicle updated successfully.");
      fetchVehicles();
      if (mode === "add") closePanel();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (plate_number) => {
    try {
      const endpoint = tab === "active"
        ? `${API}/archive/${plate_number}`
        : `${API}/unarchive/${plate_number}`;
      const res = await fetch(endpoint, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed");
      fetchVehicles(); closePanel();
    } catch (e) { setFormError(e.message); }
  };

  const handleDelete = async (plate_number) => {
    try {
      const res = await fetch(`${API}/${plate_number}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setDeleteConfirm(null); fetchVehicles(); closePanel();
    } catch (e) { setFormError(e.message); }
  };

  const panelOpen = mode === "add" || selected !== null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Vehicle Management</h1>
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${tab === "active" ? styles.tabActive : ""}`} onClick={() => setTab("active")}>Active</button>
            <button className={`${styles.tab} ${tab === "archived" ? styles.tabActive : ""}`} onClick={() => setTab("archived")}>Archived</button>
          </div>
        </div>
        <div className={styles.headerRight}>
          <input className={styles.search} placeholder="Search by plate, make, model…" value={search} onChange={(e) => setSearch(e.target.value)} />
          {tab === "active" && <button className={styles.btnAdd} onClick={openAdd}>+ Add Vehicle</button>}
        </div>
      </div>

      {/* filter & sort bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Vehicle Type</label>
          <select
            className={styles.filterSelect}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
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
          {loading ? (
            <div className={styles.empty}>Loading…</div>
          ) : vehicles.length === 0 ? (
            <div className={styles.empty}>No vehicles found.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Plate #</th>
                  <th>Type</th>
                  <th>Make / Model</th>
                  <th>Year</th>
                  <th>Color</th>
                  <th>Owner (License #)</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr
                    key={v.plate_number}
                    className={selected?.plate_number === v.plate_number ? styles.rowSelected : ""}
                    onClick={() => openView(v)}
                  >
                    <td className={`${styles.nameCell} ${styles.mono}`}>{v.plate_number}</td>
                    <td>{v.vehicle_type}</td>
                    <td>{v.make} {v.model}</td>
                    <td>{v.year}</td>
                    <td>{v.color}</td>
                    <td className={styles.mono}>{v.license_number}</td>
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
                {mode === "add" ? "Add New Vehicle" : mode === "edit" ? "Edit Vehicle" : "Vehicle Details"}
              </span>
              <button className={styles.closeBtn} onClick={closePanel}>✕</button>
            </div>

            <div className={styles.panelBody}>
              {mode === "view" && selected && (
                <>
                  <DetailRow label="Plate Number" value={selected.plate_number} mono />
                  <DetailRow label="Vehicle Type" value={selected.vehicle_type} />
                  <DetailRow label="Engine Number" value={selected.engine_number} mono />
                  <DetailRow label="Chassis Number" value={selected.chassis_number} mono />
                  <DetailRow label="Year" value={selected.year} />
                  <DetailRow label="Make" value={selected.make} />
                  <DetailRow label="Model" value={selected.model} />
                  <DetailRow label="Color" value={selected.color} />
                  <DetailRow label="Owner License #" value={selected.license_number} mono />

                  <div className={styles.panelActions}>
                    {tab === "active" && <button className={styles.btnEdit} onClick={() => openEdit(selected)}>Edit</button>}
                    <button className={styles.btnArchive} onClick={() => handleArchive(selected.plate_number)}>
                      {tab === "active" ? "Archive" : "Unarchive"}
                    </button>
                    <button className={styles.btnDelete} onClick={() => setDeleteConfirm(selected.plate_number)}>Delete</button>
                  </div>
                </>
              )}

              {(mode === "add" || mode === "edit") && (
                <>
                  <FormField label="Plate Number" name="plate_number" value={form.plate_number} onChange={handleField} disabled={mode === "edit"} />
                  <FormSelect label="Vehicle Type" name="vehicle_type" value={form.vehicle_type} onChange={handleField} options={VEHICLE_TYPES} />
                  <FormField label="Engine Number" name="engine_number" value={form.engine_number} onChange={handleField} />
                  <FormField label="Chassis Number" name="chassis_number" value={form.chassis_number} onChange={handleField} />
                  <FormField label="Year" name="year" type="number" value={form.year} onChange={handleField} />
                  <FormField label="Make" name="make" value={form.make} onChange={handleField} />
                  <FormField label="Model" name="model" value={form.model} onChange={handleField} />
                  <FormField label="Color" name="color" value={form.color} onChange={handleField} />
                  <FormField label="Owner License #" name="license_number" value={form.license_number} onChange={handleField} />

                  {formError && <p className={styles.formError}>{formError}</p>}
                  {formSuccess && <p className={styles.formSuccess}>{formSuccess}</p>}

                  <div className={styles.panelActions}>
                    <button className={styles.btnSave} onClick={handleSubmit} disabled={submitting}>
                      {submitting ? "Saving…" : "Save"}
                    </button>
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
            <h3 className={styles.modalTitle}>Permanently Delete Vehicle?</h3>
            <p className={styles.modalBody}>
              This will permanently remove <strong>{deleteConfirm}</strong> and all its associated violations and registrations. This cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnDelete} onClick={() => handleDelete(deleteConfirm)}>Yes, Delete Permanently</button>
              <button className={styles.btnCancel} onClick={() => setDeleteConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={`${styles.detailValue} ${mono ? styles.mono : ""}`}>{value ?? "—"}</span>
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