import db from "../config/db.js";

// =====================
// HELPER FUNCTIONS
// =====================

function generateRegistrationNumber() {
  const min = 100000000;
  const max = 999999999;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

export function isValidRegistrationNumber(registrationNumber) {
  return /^\d{9}$/.test(registrationNumber);
}

export async function getVehicleByMV(MV_number) {
  const [rows] = await db.query(
    `SELECT * FROM vehicle WHERE MV_number = ? AND is_archived = FALSE`,
    [MV_number],
  );
  return rows[0];
}

export async function getActiveRegistrationByMV(MV_number) {
  const [rows] = await db.query(
    `SELECT * FROM vehicleRegistration
     WHERE MV_number = ? AND registration_status = 'active'
     LIMIT 1`,
    [MV_number],
  );
  return rows[0];
}

const sortMap = {
  registration_number: "registration_number",
  registration_status: "registration_status",
  registration_date:   "registration_date",
  expiration_date:     "expiration_date",
  MV_number:           "MV_number",
};

function buildOrderBy(sortBy = "registration_date", order = "DESC") {
  const safeOrder = order?.toUpperCase() === "ASC" ? "ASC" : "DESC";
  const safeField = sortMap[sortBy] || "registration_date";
  return `ORDER BY ${safeField} ${safeOrder}`;
}

// =====================
// CRUD
// =====================

// --- GET ALL REGISTRATIONS ---
export async function getAllRegistrations(sortBy, order) {
  const ob = buildOrderBy(sortBy, order);

  const [rows] = await db.query(`
    SELECT vr.*, v.plate_number
    FROM vehicleRegistration vr
    LEFT JOIN vehicle v ON vr.MV_number = v.MV_number
    ${ob}
  `);

  return rows;
}

// --- SEARCH / FILTER REGISTRATIONS ---
export async function searchRegistrations(filters = {}, sortBy, order) {
  console.log("SERVICE FILTERS:", JSON.stringify(filters));

  const ob = buildOrderBy(sortBy, order);
  const values = [];

  let query = `
    SELECT vr.*, v.plate_number
    FROM vehicleRegistration vr
    LEFT JOIN vehicle v ON vr.MV_number = v.MV_number
    WHERE 1=1
  `;

  // KEYWORD SEARCH
  if (filters.keyword?.trim()) {
    const search = `%${filters.keyword.trim()}%`;
    query += `
      AND (
        vr.registration_number LIKE ?
        OR vr.MV_number LIKE ?
        OR v.plate_number LIKE ?
      )
    `;
    values.push(search, search, search);
  }

  // STATUS FILTER
  if (filters.status) {
    query += ` AND vr.registration_status = ?`;
    values.push(filters.status);
  }

  // EXPIRED AS OF DATE (for report)
  if (filters.expired && filters.date) {
    query += ` AND vr.expiration_date <= ?`;
    values.push(filters.date);
  }

  // MV HISTORY FILTER
  if (filters.MV_number) {
    query += ` AND vr.MV_number = ?`;
    values.push(filters.MV_number);
  }

  query += ` ${ob}`;

  const [result] = await db.query(query, values);
  return result;
}

// --- CREATE REGISTRATION ---
export async function createRegistration(data) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    let lastError;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const [vehicle] = await connection.query(
          `SELECT 1 FROM vehicle WHERE MV_number = ? AND is_archived = FALSE LIMIT 1`,
          [data.MV_number],
        );

        if (vehicle.length === 0) {
          const err = new Error("Vehicle does not exist");
          err.code = "VEHICLE_NOT_FOUND";
          throw err;
        }

        const [active] = await connection.query(
          `SELECT 1 FROM vehicleRegistration
           WHERE MV_number = ? AND registration_status = 'active'
           LIMIT 1`,
          [data.MV_number],
        );

        if (active.length > 0) {
          const err = new Error("Vehicle already has an active registration");
          err.code = "ACTIVE_REGISTRATION_EXISTS";
          throw err;
        }

        if (
          data.registration_number &&
          !isValidRegistrationNumber(data.registration_number)
        ) {
          const err = new Error(
            "Invalid registration number format. Expected: 9 digits (e.g. 123456789)",
          );
          err.code = "INVALID_REGISTRATION_FORMAT";
          throw err;
        }

        const registration_number =
          data.registration_number || generateRegistrationNumber();

        const [result] = await connection.query(
          `INSERT INTO vehicleRegistration (
            registration_number,
            registration_status,
            registration_date,
            expiration_date,
            MV_number
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            registration_number,
            data.registration_status || "active",
            data.registration_date,
            data.expiration_date,
            data.MV_number,
          ],
        );

        await connection.commit();
        return { ...result, registration_number };
      } catch (err) {
        lastError = err;

        if (err.code === "ER_DUP_ENTRY" && !data.registration_number) {
          continue;
        }

        if (err.code === "ER_DUP_ENTRY" && data.registration_number) {
          const dupErr = new Error("Registration number already exists");
          dupErr.code = "DUPLICATE_REGISTRATION_NUMBER";
          throw dupErr;
        }

        throw err;
      }
    }

    throw lastError || new Error("Failed to generate registration number");
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// --- UPDATE REGISTRATION ---
export async function updateRegistration(registration_number, data) {
  const [result] = await db.query(
    `UPDATE vehicleRegistration
     SET
       registration_status = ?,
       registration_date = ?,
       expiration_date = ?
     WHERE registration_number = ?`,
    [
      data.registration_status,
      data.registration_date,
      data.expiration_date,
      registration_number,
    ],
  );

  if (result.affectedRows === 0) {
    const err = new Error("Registration not found");
    err.code = "REGISTRATION_NOT_FOUND";
    throw err;
  }

  return result;
}

// --- DELETE REGISTRATION ---
export async function deleteRegistration(registration_number) {
  const [result] = await db.query(
    `DELETE FROM vehicleRegistration WHERE registration_number = ?`,
    [registration_number],
  );

  if (result.affectedRows === 0) {
    const err = new Error("Registration not found");
    err.code = "REGISTRATION_NOT_FOUND";
    throw err;
  }

  return result;
}

// --- RENEW REGISTRATION ---
export async function renewRegistration({ MV_number }) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const vehicle = await getVehicleByMV(MV_number);
    if (!vehicle) {
      const err = new Error("Vehicle does not exist");
      err.code = "VEHICLE_NOT_FOUND";
      throw err;
    }

    const active = await getActiveRegistrationByMV(MV_number);
    if (active) {
      const err = new Error("Vehicle already has an active registration");
      err.code = "ACTIVE_REGISTRATION_EXISTS";
      throw err;
    }

    let lastError;

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const registration_number = generateRegistrationNumber();

        const [result] = await connection.query(
          `INSERT INTO vehicleRegistration (
            registration_number,
            registration_status,
            registration_date,
            expiration_date,
            MV_number
          ) VALUES (
            ?,
            'active',
            CURDATE(),
            DATE_ADD(CURDATE(), INTERVAL 5 YEAR),
            ?
          )`,
          [registration_number, MV_number],
        );

        await connection.commit();
        return { ...result, registration_number };
      } catch (err) {
        lastError = err;
        if (err.code === "ER_DUP_ENTRY") continue;
        throw err;
      }
    }

    throw lastError || new Error("Failed to generate unique registration number");
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}