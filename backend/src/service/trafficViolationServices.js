// src/service/trafficViolationServices.js

import db from "../config/db.js";

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

function generateViolationTicketID() {
  return Math.floor(Math.random() * 1e15)
    .toString()
    .padStart(15, "0");
}

export function isValidViolationTicketID(id) {
  return /^\d{15}$/.test(id);
}

// Whitelist of sortable columns — values match frontend SORT_OPTIONS exactly
const sortMap = {
  date:                 "date",
  fine_amount:          "fine_amount",
  violation_type:       "violation_type",
  violation_status:     "violation_status",
  city:                 "city",
  province:             "province",
  region:               "region",
  apprehending_officer: "apprehending_officer",
  violation_ticket_id:  "violation_ticket_id",
};

function buildOrderBy(sortBy = "date", order = "DESC") {
  const safeField = sortMap[sortBy] ?? "date";
  const safeOrder = order?.toUpperCase() === "ASC" ? "ASC" : "DESC";
  return `ORDER BY ${safeField} ${safeOrder}`;
}

// ─────────────────────────────────────────────
//  CRUD
// ─────────────────────────────────────────────

// GET ALL (active) — supports ?type= and ?status= filters + sort
export async function getAllViolations(filters = {}, sortBy, order) {
  const orderBy = buildOrderBy(sortBy, order);
  const values  = [];

  let query = `
    SELECT *
    FROM trafficViolation
    WHERE is_archived = FALSE
  `;

  // Optional violation_type filter
  if (filters.type) {
    query += ` AND violation_type = ?`;
    values.push(filters.type);
  }

  // Optional violation_status filter
  if (filters.status) {
    query += ` AND violation_status = ?`;
    values.push(filters.status);
  }

  query += ` ${orderBy}`;

  const [rows] = await db.query(query, values);
  return rows;
}

// GET ALL ARCHIVED — supports ?type= and ?status= filters + sort
export async function getAllArchivedViolations(filters = {}, sortBy, order) {
  const orderBy = buildOrderBy(sortBy, order);
  const values  = [];

  let query = `
    SELECT *
    FROM trafficViolation
    WHERE is_archived = TRUE
  `;

  if (filters.type) {
    query += ` AND violation_type = ?`;
    values.push(filters.type);
  }

  if (filters.status) {
    query += ` AND violation_status = ?`;
    values.push(filters.status);
  }

  query += ` ${orderBy}`;

  const [rows] = await db.query(query, values);
  return rows;
}

// SEARCH — keyword across multiple columns + optional type/status filters + sort
export async function searchViolations(filters = {}, sortBy, order) {
  const orderBy = buildOrderBy(sortBy, order);
  const values  = [];

  let query = `
    SELECT *
    FROM trafficViolation
    WHERE 1=1
  `;

  // Archive filter
  if (filters.isArchived !== undefined) {
    query += ` AND is_archived = ?`;
    values.push(filters.isArchived);
  } else {
    query += ` AND is_archived = FALSE`;
  }

  // Keyword search across all text columns
  if (filters.keyword?.trim()) {
    const kw = `%${filters.keyword.trim()}%`;
    query += `
      AND (
        violation_ticket_id  LIKE ?
        OR violation_type    LIKE ?
        OR violation_status  LIKE ?
        OR city              LIKE ?
        OR province          LIKE ?
        OR region            LIKE ?
        OR barangay          LIKE ?
        OR license_number    LIKE ?
        OR MV_number         LIKE ?
        OR apprehending_officer LIKE ?
      )
    `;
    values.push(kw, kw, kw, kw, kw, kw, kw, kw, kw, kw);
  }

  // Optional violation_type filter (combinable with keyword)
  if (filters.type) {
    query += ` AND violation_type = ?`;
    values.push(filters.type);
  }

  // Optional violation_status filter (combinable with keyword)
  if (filters.status) {
    query += ` AND violation_status = ?`;
    values.push(filters.status);
  }

  query += ` ${orderBy}`;

  const [rows] = await db.query(query, values);
  return rows;
}

// CREATE
export async function createViolation(data) {
  if (data.violation_ticket_id && !isValidViolationTicketID(data.violation_ticket_id)) {
    const err = new Error("Invalid violation ticket ID format. Expected: 15-digit number");
    err.code = "INVALID_TICKET_FORMAT";
    throw err;
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      if (data.license_number) {
        const [driver] = await db.query(
          `SELECT 1 FROM driver WHERE license_number = ? LIMIT 1`,
          [data.license_number]
        );
        if (!driver.length) {
          const err = new Error("Invalid license_number: driver does not exist");
          err.code = "INVALID_DRIVER";
          throw err;
        }
      }

      if (data.MV_number) {
        const [vehicle] = await db.query(
          `SELECT 1 FROM vehicle WHERE MV_number = ? LIMIT 1`,
          [data.MV_number]
        );
        if (!vehicle.length) {
          const err = new Error("Invalid MV_number: vehicle does not exist");
          err.code = "INVALID_VEHICLE";
          throw err;
        }
      }

      const violation_ticket_id = data.violation_ticket_id || generateViolationTicketID();

      const [result] = await db.query(
        `INSERT INTO trafficViolation (
          violation_ticket_id, violation_type, violation_status,
          barangay, city, province, region,
          date, fine_amount, apprehending_officer,
          license_number, MV_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          violation_ticket_id,
          data.violation_type,
          data.violation_status,
          data.barangay,
          data.city,
          data.province,
          data.region,
          data.date,
          data.fine_amount,
          data.apprehending_officer,
          data.license_number,
          data.MV_number,
        ]
      );

      return { ...result, violation_ticket_id };
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY" && !data.violation_ticket_id) continue;
      if (err.code === "ER_DUP_ENTRY" && data.violation_ticket_id) {
        const e = new Error("Violation ticket ID already exists");
        e.code = "DUPLICATE_TICKET_ID";
        throw e;
      }
      if (err.code === "ER_BAD_NULL_ERROR") {
        const e = new Error("Missing required violation fields");
        e.code = "MISSING_FIELDS";
        throw e;
      }
      throw err;
    }
  }

  throw new Error("Failed to generate unique violation ticket ID");
}

// UPDATE
export async function updateViolation(violation_ticket_id, data) {
  if (data.license_number) {
    const [driver] = await db.query(
      `SELECT 1 FROM driver WHERE license_number = ? LIMIT 1`,
      [data.license_number]
    );
    if (!driver.length) {
      const err = new Error("Invalid license_number: driver does not exist");
      err.code = "INVALID_DRIVER";
      throw err;
    }
  }

  if (data.MV_number) {
    const [vehicle] = await db.query(
      `SELECT 1 FROM vehicle WHERE MV_number = ? LIMIT 1`,
      [data.MV_number]
    );
    if (!vehicle.length) {
      const err = new Error("Invalid MV_number: vehicle does not exist");
      err.code = "INVALID_VEHICLE";
      throw err;
    }
  }

  const [result] = await db.query(
    `UPDATE trafficViolation
     SET
       violation_type       = ?,
       violation_status     = ?,
       barangay             = ?,
       city                 = ?,
       province             = ?,
       region               = ?,
       date                 = ?,
       fine_amount          = ?,
       apprehending_officer = ?,
       license_number       = ?,
       MV_number            = ?
     WHERE violation_ticket_id = ?
       AND is_archived = FALSE`,
    [
      data.violation_type,
      data.violation_status,
      data.barangay,
      data.city,
      data.province,
      data.region,
      data.date,
      data.fine_amount,
      data.apprehending_officer,
      data.license_number,
      data.MV_number,
      violation_ticket_id,
    ]
  );

  if (result.affectedRows === 0) {
    const err = new Error("Violation not found or is archived");
    err.code = "VIOLATION_NOT_FOUND";
    throw err;
  }

  return result;
}

// ARCHIVE / UNARCHIVE / DELETE
export async function archiveViolation(violation_ticket_id) {
  const [result] = await db.query(
    `UPDATE trafficViolation SET is_archived = TRUE WHERE violation_ticket_id = ?`,
    [violation_ticket_id]
  );
  return result;
}

export async function unarchiveViolation(violation_ticket_id) {
  const [result] = await db.query(
    `UPDATE trafficViolation SET is_archived = FALSE WHERE violation_ticket_id = ?`,
    [violation_ticket_id]
  );
  return result;
}

export async function deleteViolation(violation_ticket_id) {
  const [result] = await db.query(
    `DELETE FROM trafficViolation WHERE violation_ticket_id = ?`,
    [violation_ticket_id]
  );
  return result;
}

// ─────────────────────────────────────────────
//  REPORTS
// ─────────────────────────────────────────────

// REPORT 1 — Total violations per type for a given year
// Frontend sends: ?year=2024
export async function getViolationTotalsByType(year) {
  const [rows] = await db.query(
    `SELECT
       violation_type,
       COUNT(*) AS total_violations
     FROM trafficViolation
     WHERE YEAR(date) = ?
       AND is_archived = FALSE
     GROUP BY violation_type
     ORDER BY total_violations DESC`,
    [year]
  );
  return rows;
}

// REPORT 2 — Violations committed by a given driver within a date range
// Frontend sends: ?license_number=...&from=YYYY-MM-DD&to=YYYY-MM-DD
export async function getViolationsByDriver(license_number, from, to) {
  const values = [license_number];
  let query = `
    SELECT
      t.violation_ticket_id,
      t.violation_type,
      t.violation_status,
      t.date,
      t.city,
      t.province,
      t.fine_amount,
      t.apprehending_officer,
      t.MV_number
    FROM trafficViolation t
    WHERE t.license_number = ?
      AND t.is_archived = FALSE
  `;

  // Date range is optional — omitting it returns all violations for the driver
  if (from) { query += ` AND t.date >= ?`; values.push(from); }
  if (to)   { query += ` AND t.date <= ?`; values.push(to);   }

  query += ` ORDER BY t.date DESC`;

  const [rows] = await db.query(query, values);
  return rows;
}

// REPORT 3 — Vehicles involved in violations within a given city or region
// Frontend sends: ?city=...  (city is used for both city and region search)
// FIX: removed the nonexistent t.location column — uses t.city and t.region instead
export async function getViolationsByLocation(city, region, sortBy, order) {
  const orderBy = buildOrderBy(sortBy, order);
  const values  = [];

  let query = `
    SELECT
      t.violation_ticket_id,
      t.violation_type,
      t.violation_status,
      t.date,
      t.barangay,
      t.city,
      t.province,
      t.region,
      t.fine_amount,
      v.MV_number,
      v.vehicle_type,
      v.make,
      v.model,
      v.plate_number
    FROM trafficViolation t
    JOIN vehicle v ON v.MV_number = t.MV_number
    WHERE t.is_archived = FALSE
  `;

  // city param searches both city AND region (matches Reports.jsx "City / Region" label)
  if (city) {
    query += ` AND (t.city LIKE ? OR t.region LIKE ?)`;
    const likeTerm = `%${city}%`;
    values.push(likeTerm, likeTerm);
  }

  if (region) {
    query += ` AND t.region LIKE ?`;
    values.push(`%${region}%`);
  }

  query += ` ${orderBy}`;

  const [rows] = await db.query(query, values);
  return rows;
}