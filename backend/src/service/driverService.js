import db from "../config/db.js";
import { formatDate } from "../utils/formatDate.js";

// =====================
// HELPER FUNCTIONS
// =====================

// generate random license number
function generateLicenseNumber() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // A01 style prefix
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const num1 = String(Math.floor(Math.random() * 100)).padStart(2, "0");
  const prefix = `${letter}${num1}`;

  // middle section (01–99)
  const mid = String(Math.floor(Math.random() * 99) + 1).padStart(2, "0");

  // last 6 digits
  const last = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");

  return `${prefix}-${mid}-${last}`;
}

// validate license number format
function isValidLicenseNumber(license_number) {
  // format: A01-01-123456
  const regex = /^[A-Z]\d{2}-\d{2}-\d{6}$/;

  return regex.test(license_number);
}

// age expression constant
const AGE_EXPR = "TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE())";

// allowed driver table columns for sorting (!! FIX: EDIT THIS LATER ONCE UI IMPLEMENTED)
const sortMap = {
  license_number: "license_number",
  full_name: "full_name",
  sex: "sex",
  date_of_birth: "date_of_birth",
  barangay: "barangay",
  city: "city",
  province: "province",
  region: "region",
  license_type: "license_type",
  license_status: "license_status",
  license_issuance_date: "license_issuance_date",
  license_expiration_date: "license_expiration_date",

  // computed field
  age: `${AGE_EXPR}`,
};

// sorting
function buildOrderBy(sortBy = "full_name", order = "ASC") {
  const safeOrder = order?.toUpperCase() === "DESC" ? "DESC" : "ASC";

  const safeField = sortMap[sortBy] || "full_name";

  return `ORDER BY ${safeField} ${safeOrder}`;
}

// =====================
// CRUD
// =====================

// --- GET ALL DRIVERS (ACTIVE) ---
export async function getAllDrivers(sortBy, order) {
  const orderBy = buildOrderBy(sortBy, order);

  const [rows] = await db.query(`
    SELECT *
    FROM driver
    WHERE is_archived = FALSE
    ${orderBy}
  `);

  return rows;
}

// --- GET ALL DRIVERS (ARCHIVED) ---
export async function getAllArchivedDrivers(sortBy, order) {
  const orderBy = buildOrderBy(sortBy, order);

  const [rows] = await db.query(`
    SELECT *
    FROM driver
    WHERE is_archived = TRUE
    ${orderBy}
  `);

  return rows;
}

// --- SEARCH DRIVERS (ACTIVE / ARCHIVED) + REPORTS ---
export async function searchDrivers(filters = {}, sortBy, order) {
  let query = `
    SELECT *
    FROM driver
    WHERE 1=1
  `;

  const values = [];

  // ARCHIVE FILTER
  if (filters.isArchived === "true") {
    query += ` AND is_archived = TRUE`;
  } else if (filters.isArchived === "false") {
    query += ` AND is_archived = FALSE`;
  } else {
    // default behavior
    query += ` AND is_archived = FALSE`;
  }

  // KEYWORD SEARCH
  if (filters.keyword?.trim()) {
    const search = `%${filters.keyword.trim()}%`;

    query += `
      AND (
        full_name LIKE ?
        OR license_number LIKE ?
        OR city LIKE ?
        OR province LIKE ?
      )
    `;

    values.push(search, search, search, search);
  }

  // SEX FILTER
  if (filters.sex) {
    query += ` AND sex = ?`;
    values.push(filters.sex);
  }

  // STATUS FILTER
  if (filters.status) {
    query += ` AND license_status = ?`;
    values.push(filters.status);
  }

  // TYPE FILTER
  if (filters.type) {
    query += ` AND license_type = ?`;
    values.push(filters.type);
  }

  // AGE RANGE (FIXED SAFELY)
  const hasMinAge = filters.minAge !== undefined && filters.minAge !== "";
  const hasMaxAge = filters.maxAge !== undefined && filters.maxAge !== "";

  if (hasMinAge && hasMaxAge) {
    query += ` AND ${AGE_EXPR} BETWEEN ? AND ?`;
    values.push(Number(filters.minAge), Number(filters.maxAge));
  }

  // SORTING
  query += ` ${buildOrderBy(sortBy, order)}`;

  const [rows] = await db.query(query, values);
  return rows;
}

// --- CREATE DRIVER ---
export async function createDriver(data) {
  // validate manually provided license number
  if (data.license_number && !isValidLicenseNumber(data.license_number)) {
    const err = new Error(
      "Invalid license number format. Expected: A01-01-123456",
    );

    err.code = "INVALID_LICENSE_FORMAT";

    throw err;
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      // use provided license number OR generate one
      const license_number = data.license_number || generateLicenseNumber();

      const query = `
        INSERT INTO driver (
          license_number,
          full_name,
          sex,
          date_of_birth,
          barangay,
          city,
          province,
          region,
          license_type,
          license_status,
          license_issuance_date,
          license_expiration_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        license_number,
        data.full_name,
        data.sex,
        data.date_of_birth,
        data.barangay,
        data.city,
        data.province,
        data.region,
        data.license_type,
        data.license_status,
        data.license_issuance_date,
        data.license_expiration_date,
      ];

      const [result] = await db.query(query, values);

      return {
        ...result,
        license_number,
      };
    } catch (err) {
      console.log("CREATE DRIVER ERROR:", err.code, err.message);

      // retry only if auto-generated duplicate
      if (err.code === "ER_DUP_ENTRY" && !data.license_number) {
        continue;
      }

      // duplicate manually provided license number
      if (err.code === "ER_DUP_ENTRY" && data.license_number) {
        const err = new Error("License number already exists");

        err.code = "DUPLICATE_LICENSE_NUMBER";

        throw err;
      }

      // missing required fields
      if (err.code === "ER_BAD_NULL_ERROR") {
        const err = new Error("Missing required driver fields");

        err.code = "MISSING_FIELDS";

        throw err;
      }

      throw err;
    }
  }

  throw new Error("Failed to generate unique license number");
}

// --- UPDATE DRIVER ---
export async function updateDriver(license_number, data) {
  const query = `
    UPDATE driver
    SET 
      full_name = ?,
      sex = ?,
      date_of_birth = ?,
      barangay = ?,
      city = ?,
      province = ?,
      region = ?,
      license_type = ?,
      license_status = ?,
      license_issuance_date = ?,
      license_expiration_date = ?
    WHERE 
      is_archived = FALSE
      AND license_number = ?
  `;

  const values = [
    data.full_name,
    data.sex,
    data.date_of_birth,
    data.barangay,
    data.city,
    data.province,
    data.region,
    data.license_type,
    data.license_status,
    data.license_issuance_date,
    data.license_expiration_date,
    license_number,
  ];

  const [result] = await db.query(query, values);

  // driver not found
  if (result.affectedRows === 0) {
    const err = new Error("Driver not found");

    err.code = "DRIVER_NOT_FOUND";

    throw err;
  }

  return result;
}

// --- RENEW DRIVER LICENSE ---
export async function renewDriver(license_number) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // check driver exists + get expiration
    const [driverRows] = await connection.query(
      `
      SELECT license_expiration_date 
      FROM driver 
      WHERE license_number = ? 
        AND is_archived = FALSE
      LIMIT 1
      `,
      [license_number],
    );

    if (driverRows.length === 0) {
      const err = new Error("Driver does not exist");

      err.code = "DRIVER_NOT_FOUND";

      throw err;
    }

    const expirationDate = new Date(driverRows[0].license_expiration_date);
    const today = new Date();

    // enforce 60-day renewal rule
    const diffDays = Math.ceil(
      (expirationDate - today) / (1000 * 60 * 60 * 24),
    );

    if (diffDays > 60) {
      const err = new Error(
        "Renewal is only allowed within 60 days before expiration",
      );
      err.code = "RENEWAL_TOO_EARLY";
      throw err;
    }

    // only active (unpaid, active) violations
    const [violationRows] = await connection.query(
      `
      SELECT 1 
      FROM trafficViolation 
      WHERE license_number = ?
        AND violation_status != 'paid'
      LIMIT 1
      `,
      [license_number],
    );

    const hasActiveViolation = violationRows.length > 0;

    // rule: 10 years if clean, otherwise 5 years
    const years = hasActiveViolation ? 5 : 10;

    // update license
    const [result] = await connection.query(
      `
      UPDATE driver
      SET
        license_issuance_date = CURDATE(),
        license_expiration_date = DATE_ADD(CURDATE(), INTERVAL ? YEAR)
      WHERE license_number = ? AND is_archived = FALSE
      `,
      [years, license_number],
    );

    await connection.commit();

    return {
      ...result,
      license_number,
      validity_years: years,
      has_active_violation: hasActiveViolation,
      license_issuance_date: formatDate(new Date()),
      license_expiration_date: formatDate(
        new Date(Date.now() + years * 365 * 24 * 60 * 60 * 1000),
      ),
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// --- ARCHIVE DRIVER ---
export async function archiveDriver(license_number) {
  const [result] = await db.query(
    `
    UPDATE driver
    SET is_archived = TRUE
    WHERE license_number = ?
    `,
    [license_number],
  );

  // driver not found
  if (result.affectedRows === 0) {
    const err = new Error("Driver not found");

    err.code = "DRIVER_NOT_FOUND";

    throw err;
  }

  return result;
}

// --- UNARCHIVE DRIVER ---
export async function unarchiveDriver(license_number) {
  const [result] = await db.query(
    `
    UPDATE driver
    SET is_archived = FALSE
    WHERE license_number = ?
    `,
    [license_number],
  );

  // not found
  if (result.affectedRows === 0) {
    const err = new Error("Driver not found");
    err.code = "DRIVER_NOT_FOUND";
    throw err;
  }

  return result;
}

// --- REMOVE DRIVER (HARD DELETE)---
export async function deleteDriver(license_number) {
  const [result] = await db.query(
    `
    DELETE FROM driver 
    WHERE license_number = ?
    `,
    [license_number],
  );

  // not found
  if (result.affectedRows === 0) {
    const err = new Error("Driver not found");
    err.code = "DRIVER_NOT_FOUND";
    throw err;
  }

  return result;
}
