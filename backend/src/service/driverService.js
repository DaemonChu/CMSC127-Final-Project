import db from "../config/db.js";

// =====================
// HELPER FUNCTIONS
// =====================

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

// --- GET ALL DRIVERS ---
export async function getAllDrivers(sortBy, order) {
  const orderBy = buildOrderBy(sortBy, order);

  const [rows] = await db.query(`
    SELECT *
    FROM driver
    ${orderBy}
  `);

  return rows;
}

// --- CREATE DRIVER ---
export async function createDriver(data) {
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
    data.license_number,
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
  return result;
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
    WHERE license_number = ?
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
  return result;
}

// --- REMOVE DRIVER ---
export async function deleteDriver(license_number) {
  const [result] = await db.query(
    "DELETE FROM driver WHERE license_number = ?",
    [license_number],
  );

  return result;
}

// --- SEARCH DRIVERS ---
export async function searchDrivers(keyword) {
  const search = `%${keyword}%`;

  // (!! FIX: UPDATE ONCE UI IS IMPLEMENTED)
  const query = `
    SELECT * FROM driver
    WHERE full_name LIKE ?
       OR license_number LIKE ?
       OR city LIKE ?
       OR province LIKE ?
  `;

  const [rows] = await db.query(query, [search, search, search, search]);

  return rows;
}

// =====================
// REPORT
// =====================

// --- VIEW DRIVERS (FILTERED BY) ---

// license type
export async function getByLicenseType(type, sortBy, order) {
  const orderBy = buildOrderBy(sortBy, order);

  const [rows] = await db.query(
    `
        SELECT *
        FROM driver
        WHERE license_type = ?
        ${orderBy}
        `,
    [type],
  );

  return rows;
}

// status
export async function getByStatus(status, sortBy, order) {
  const orderBy = buildOrderBy(sortBy, order);

  const [rows] = await db.query(
    `
        SELECT *
        FROM driver
        WHERE license_status = ?
        ${orderBy}
        `,
    [status],
  );

  return rows;
}

// age range
export async function getByAgeRange(min, max, sortBy, order) {
  const orderBy = buildOrderBy(sortBy, order);

  const [rows] = await db.query(
    `
        SELECT *,
        ${AGE_EXPR} AS age
        FROM driver
        WHERE ${AGE_EXPR}
        BETWEEN ? AND ?
        ${orderBy}
        `,
    [min, max],
  );

  return rows;
}

// sex
export async function getBySex(sex, sortBy, order) {
  const orderBy = buildOrderBy(sortBy, order);

  const [rows] = await db.query(
    `
        SELECT *
        FROM driver
        WHERE sex = ?
        ${orderBy}
        `,
    [sex],
  );

  return rows;
}

// --- VIEW ALL DRIVERS (EXPIRED / SUSPENDED) ---
export async function getDriversWithBadStatus(sortBy, order) {
  const orderBy = buildOrderBy(sortBy, order);

  const [rows] = await db.query(
    `
        SELECT *
        FROM driver
        WHERE license_status IN ('expired', 'suspended')
        ${orderBy}
        `,
  );

  return rows;
}
