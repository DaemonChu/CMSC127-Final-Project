import db from "../config/db.js";

// =====================
// HELPER FUNCTIONS
// =====================

async function validateVehicle(data) {
  // check driver exists
  const [driver] = await db.query(
    "SELECT 1 FROM driver WHERE license_number = ? LIMIT 1",
    [data.license_number],
  );

  if (driver.length === 0) {
    const err = new Error("Driver does not exist");
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  // check plate number
  const [plate] = await db.query(
    "SELECT 1 FROM vehicle WHERE plate_number = ? LIMIT 1",
    [data.plate_number],
  );

  if (plate.length > 0) {
    const err = new Error("Plate number already exists");
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  // check engine number
  const [engine] = await db.query(
    "SELECT 1 FROM vehicle WHERE engine_number = ? LIMIT 1",
    [data.engine_number],
  );

  if (engine.length > 0) {
    const err = new Error("Engine number already exists");
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  // check chassis number
  const [chassis] = await db.query(
    "SELECT 1 FROM vehicle WHERE chassis_number = ? LIMIT 1",
    [data.chassis_number],
  );

  if (chassis.length > 0) {
    const err = new Error("Chassis number already exists");
    err.code = "VALIDATION_ERROR";
    throw err;
  }
}

// randomly generate MV number
function generateMVNumber() {
  // sample agency codes
  const prefixes = ["1328", "1380", "1396", "1372", "1388"];

  // pick random prefix
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

  // 12-digit random number
  const min = 100000000000;
  const max = 999999999999;

  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

  console.log(`${prefix}-${randomNumber}`);
  return `${prefix}-${randomNumber}`;
}

export function isValidMVNumber(mvNumber) {
  // format: 4 digits - 12 digits (example: 1388-123456789012)
  const regex = /^\d{4}-\d{12}$/;
  return regex.test(mvNumber);
}

// allowed vehicle table columns for sorting (!! FIX: EDIT THIS LATER ONCE UI IMPLEMENTED)
const sortMap = {
  MV_number: "MV_number",
  plate_number: "plate_number",
  vehicle_type: "vehicle_type",
  make: "make",
  model: "model",
  year: "year",
  color: "color",
  license_number: "license_number",
};

// sorting
function buildOrderBy(sortBy = "MV_number", order = "ASC") {
  const safeOrder = order?.toUpperCase() === "DESC" ? "DESC" : "ASC";

  const safeField = sortMap[sortBy] || "MV_number";

  return `ORDER BY ${safeField} ${safeOrder}`;
}

// =====================
// CRUD
// =====================

// --- GET ALL VEHICLES ---
export async function getAllVehicles(sortBy, order) {
  const orderBy = buildOrderBy(sortBy, order);

  const [rows] = await db.query(
    `
    SELECT *
    FROM vehicle
    WHERE is_archived = FALSE
    ${orderBy}
    `,
  );

  return rows;
}

// --- GET ALL ARCHIVED VEHICLES ---
export async function getAllArchivedVehicles(sortBy, order) {
  const orderBy = buildOrderBy(sortBy, order);

  const [rows] = await db.query(
    `
    SELECT *
    FROM vehicle
    WHERE is_archived = TRUE
    ${orderBy}
    `,
  );

  return rows;
}

// --- SEARCH VEHICLES + REPORT (driver filter) ---
export async function searchVehicles(
  keyword,
  license_number,
  vehicleType,
  isArchived = false,
  sortBy,
  order,
) {
  const search = `%${keyword}%`;
  const orderBy = buildOrderBy(sortBy, order);

  let query = `
    SELECT *
    FROM vehicle
    WHERE is_archived = ?
  `;

  const values = [isArchived];

  // KEYWORD SEARCH
  if (keyword) {
    query += `
      AND (
        MV_number LIKE ?
        OR plate_number LIKE ?
        OR vehicle_type LIKE ?
        OR make LIKE ?
        OR model LIKE ?
        OR color LIKE ?
        OR license_number LIKE ?
      )
    `;

    values.push(search, search, search, search, search, search, search);
  }

  // DRIVER FILTER
  if (license_number) {
    query += ` AND license_number = ?`;
    values.push(license_number);
  }

  if (vehicleType) {
    query += ` AND LOWER(vehicle_type) = ?`;
    values.push(vehicleType.toLowerCase());
  }

  query += ` ${orderBy}`;
  const [rows] = await db.query(query, values);
  return rows;
}

// --- CREATE VEHICLE ---
export async function createVehicle(data) {
  // 1. validate manually provided MV number
  if (data.MV_number && !isValidMVNumber(data.MV_number)) {
    const err = new Error(
      "Invalid MV number format. Expected: 1234-123456789012",
    );

    err.code = "INVALID_MV_FORMAT";
    throw err;
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      await validateVehicle(data);

      // 2. use provided OR generate
      const MV_number = data.MV_number || generateMVNumber();

      const query = `
        INSERT INTO vehicle (
          MV_number,
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        MV_number,
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

      return {
        ...result,
        MV_number,
      };
    } catch (err) {
      console.log("CREATE VEHICLE ERROR:", err.code, err.message);

      // retry ONLY if auto-generated MV number duplicates
      if (err.code === "ER_DUP_ENTRY" && !data.MV_number) {
        continue;
      }

      // duplicate manually provided MV number
      if (err.code === "ER_DUP_ENTRY" && data.MV_number) {
        const err = new Error("MV number already exists");

        err.code = "DUPLICATE_MV_NUMBER";
        throw err;
      }

      // missing fields
      if (err.code === "ER_BAD_NULL_ERROR") {
        const err = new Error("Missing required vehicle fields");

        err.code = "MISSING_FIELDS";
        throw err;
      }

      throw err;
    }
  }

  throw new Error("Failed to generate unique MV number");
}

// --- UPDATE VEHICLE ---
export async function updateVehicle(MV_number, data) {
  // validate license number if provided
  if (data.license_number) {
    const [driverRows] = await db.query(
      `
      SELECT license_number
      FROM driver
      WHERE license_number = ?
        AND is_archived = FALSE
      `,
      [data.license_number],
    );

    if (driverRows.length === 0) {
      const err = new Error("License number does not exist");
      err.code = "INVALID_LICENSE_NUMBER";
      throw err;
    }
  }

  // update vehicle
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
      is_archived = FALSE
      AND MV_number = ?
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
    MV_number,
  ];

  const [result] = await db.query(query, values);

  if (result.affectedRows === 0) {
    const err = new Error("Vehicle not found");
    err.code = "VEHICLE_NOT_FOUND";
    throw err;
  }

  return result;
}

// --- ARCHIVE VEHICLE ---
export async function archiveVehicle(MV_number) {
  const [result] = await db.query(
    `
    UPDATE vehicle
    SET is_archived = TRUE
    WHERE MV_number = ?
    `,
    [MV_number],
  );

  return result;
}

// --- UNARCHIVE VEHICLE ---
export async function unarchiveVehicle(MV_number) {
  const [result] = await db.query(
    `
    UPDATE vehicle
    SET is_archived = FALSE
    WHERE MV_number = ?
    `,
    [MV_number],
  );

  return result;
}

// --- REMOVE VEHICLE ---
export async function deleteVehicle(MV_number) {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    await conn.query("DELETE FROM trafficViolation WHERE MV_number = ?", [
      MV_number,
    ]);

    await conn.query("DELETE FROM vehicleRegistration WHERE MV_number = ?", [
      MV_number,
    ]);

    const [result] = await conn.query(
      "DELETE FROM vehicle WHERE MV_number = ?",
      [MV_number],
    );

    await conn.commit();

    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
