import db from "../config/db.js";

// =====================
// HELPER FUNCTIONS
// =====================

// allowed vehicle table columns for sorting (!! FIX: EDIT THIS LATER ONCE UI IMPLEMENTED)
const sortMap = {
  plate_number: "plate_number",
  vehicle_type: "vehicle_type",
  make: "make",
  model: "model",
  year: "year",
  color: "color",
  license_number: "license_number",
};

// sorting
function buildOrderBy(sortBy = "plate_number", order = "ASC") {
  const safeOrder = order?.toUpperCase() === "DESC" ? "DESC" : "ASC";

  const safeField = sortMap[sortBy] || "plate_number";

  return `ORDER BY ${safeField} ${safeOrder}`;
}

// =====================
// CRUD
// =====================

// --- GET ALL VEHICLES ---
export async function getAllVehicles(sortBy, order) {
  const orderBy = buildOrderBy(sortBy, order);

  const [rows] = await db.query(`
    SELECT *
    FROM vehicle
    WHERE is_archived = FALSE
    ${orderBy}
  `);

  return rows;
}

// --- GET ALL ARCHIVED VEHICLES ---
export async function getAllArchivedVehicles(sortBy, order) {
  const orderBy = buildOrderBy(sortBy, order);

  const [rows] = await db.query(`
    SELECT *
    FROM vehicle
    WHERE is_archived = TRUE
    ${orderBy}
  `);

  return rows;
}

// --- SEARCH VEHICLE ---
export async function searchVehicles(keyword, isArchived = false) {
  const search = `%${keyword}%`;

  const query = `
    SELECT *
    FROM vehicle
    WHERE is_archived = ?
      AND ( plate_number LIKE ?
       OR vehicle_type LIKE ?
       OR make LIKE ?
       OR model LIKE ?
       OR color LIKE ?
       OR license_number LIKE ?
      )
  `;

  const [rows] = await db.query(query, [
    isArchived ? true : false,
    search,
    search,
    search,
    search,
    search,
    search,
  ]);

  return rows;
}

// --- CREATE VEHICLE ---
export async function createVehicle(data) {
  const query = `
    INSERT INTO vehicle (
      plate_number,
      vehicle_type,
      engine_number,
      chassis_number,
      year,
      make,
      model,
      color,
      license_number
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.plate_number,
    data.vehicle_type,
    data.engine_number,
    data.chassis_number,
    data.year,
    data.make,
    data.model,
    data.color,
    data.license_number,
  ];

  const [result] = await db.query(query, values);

  return result;
}

// --- UPDATE VEHICLE ---
export async function updateVehicle(plate_number, data) {
  const query = `
    UPDATE vehicle
    SET
      vehicle_type = ?,
      engine_number = ?,
      chassis_number = ?,
      year = ?,
      make = ?,
      model = ?,
      color = ?,
      license_number = ?
    WHERE 
        is_archived = FALSE AND
        plate_number = ?
  `;

  const values = [
    data.vehicle_type,
    data.engine_number,
    data.chassis_number,
    data.year,
    data.make,
    data.model,
    data.color,
    data.license_number,
    plate_number,
  ];

  const [result] = await db.query(query, values);

  return result;
}

// --- ARCHIVE VEHICLE ---
export async function archiveVehicle(plate_number) {
  const [result] = await db.query(
    `
    UPDATE vehicle
    SET is_archived = TRUE
    WHERE plate_number = ?
    `,
    [plate_number],
  );

  return result;
}

// --- UNARCHIVE VEHICLE ---
export async function unarchiveVehicle(plate_number) {
  const [result] = await db.query(
    `
    UPDATE vehicle
    SET is_archived = FALSE
    WHERE plate_number = ?
    `,
    [plate_number],
  );

  return result;
}

// (!! FIX: UI PEOPLE, PLEASE PLEASE DO USER CONFIRMATION SINCE THIS DELETES EVERY TRACE OF A VEHICLE)
// --- REMOVE VEHICLE ---
export async function deleteVehicle(plate_number) {
  const conn = await db.getConnection();

  try {
    // TRANSACTION
    await conn.beginTransaction();

    // delete violations
    await conn.query("DELETE FROM trafficViolation WHERE plate_number = ?", [
      plate_number,
    ]);

    // delete registrations
    await conn.query("DELETE FROM vehicleRegistration WHERE plate_number = ?", [
      plate_number,
    ]);

    // delete vehicle
    const [result] = await conn.query(
      "DELETE FROM vehicle WHERE plate_number = ?",
      [plate_number],
    );

    await conn.commit();

    return result;
  } catch (err) {
    // rollback if something went wrong
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// =====================
// REPORT
// =====================
