import db from "../config/db.js";

// =====================
// HELPER FUNCTIONS
// =====================

// generate violation ticket ID
function generateViolationTicketID() {
  return Math.floor(Math.random() * 1e15)
    .toString()
    .padStart(15, "0");
}

// validate ticket ID format
export function isValidViolationTicketID(id) {
  return /^\d{15}$/.test(id);
}

// sortable fields
const sortMap = {
  violation_ticket_id: "violation_ticket_id",
  violation_type: "violation_type",
  violation_status: "violation_status",
  city: "city",
  province: "province",
  region: "region",
  date: "date",
  fine_amount: "fine_amount",
  apprehending_officer: "apprehending_officer",
};

function buildOrderBy(sortBy = "date", order = "DESC") {
  const safeOrder = order?.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const safeField = sortMap[sortBy] || "date";

  return `ORDER BY ${safeField} ${safeOrder}`;
}

// =====================
// CRUD
// =====================

// --- GET ALL VIOLATIONS ---
export async function getAllViolations(sortBy, order) {
  const orderBy = buildOrderBy(sortBy, order);

  const [rows] = await db.query(`
    SELECT *
    FROM trafficViolation
    WHERE is_archived = FALSE
    ${orderBy}
  `);

  return rows;
}

// --- GET ALL ARCHIVED VIOLATIONS ---
export async function getAllArchivedViolations(sortBy, order) {
  const orderBy = buildOrderBy(sortBy, order);

  const [rows] = await db.query(`
    SELECT *
    FROM trafficViolation
    WHERE is_archived = TRUE
    ${orderBy}
  `);

  return rows;
}

// --- SEARCH VIOLATIONS ---
export async function searchViolations(filters = {}, sortBy, order) {
  const values = [];
  let query = `
    SELECT *
    FROM trafficViolation
    WHERE 1=1
  `;

  const orderBy = buildOrderBy(sortBy, order);

  // ARCHIVE FILTER
  if (filters.isArchived !== undefined) {
    query += ` AND is_archived = ?`;
    values.push(filters.isArchived);
  } else {
    query += ` AND is_archived = FALSE`;
  }

  // KEYWORD SEARCH
  if (filters.keyword?.trim()) {
    const search = `%${filters.keyword.trim()}%`;

    query += `
      AND (
        violation_ticket_id LIKE ?
        OR violation_type LIKE ?
        OR violation_status LIKE ?
        OR city LIKE ?
        OR province LIKE ?
        OR region LIKE ?
        OR license_number LIKE ?
        OR MV_number LIKE ?
      )
    `;

    values.push(search, search, search, search, search, search, search, search);
  }

  // DRIVER DATE RANGE FILTER
  if (filters.license_number && filters.startDate && filters.endDate) {
    query += `
      AND license_number = ?
      AND date BETWEEN ? AND ?
    `;

    values.push(filters.license_number, filters.startDate, filters.endDate);
  }

  query += ` ${orderBy}`;

  const [rows] = await db.query(query, values);

  return rows;
}

// --- CREATE VIOLATION ---
export async function createViolation(data) {
  // validate manually provided ticket id
  if (
    data.violation_ticket_id &&
    !isValidViolationTicketID(data.violation_ticket_id)
  ) {
    const err = new Error(
      "Invalid violation ticket ID format. Expected: 15-digit number",
    );

    err.code = "INVALID_TICKET_FORMAT";

    throw err;
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      // check if drivers exist
      if (data.license_number) {
        const [driver] = await db.query(
          `
          SELECT 1
          FROM driver
          WHERE license_number = ?
          LIMIT 1
          `,
          [data.license_number],
        );

        if (!driver.length) {
          const err = new Error(
            "Invalid license_number: driver does not exist",
          );

          err.code = "INVALID_DRIVER";

          throw err;
        }
      }

      // check if vehicles exist
      if (data.MV_number) {
        const [vehicle] = await db.query(
          `
          SELECT 1
          FROM vehicle
          WHERE MV_number = ?
          LIMIT 1
          `,
          [data.MV_number],
        );

        if (!vehicle.length) {
          const err = new Error("Invalid MV_number: vehicle does not exist");

          err.code = "INVALID_VEHICLE";

          throw err;
        }
      }

      // Uuse provided or generate id
      const violation_ticket_id =
        data.violation_ticket_id || generateViolationTicketID();

      const query = `
        INSERT INTO trafficViolation (
          violation_ticket_id,
          violation_type,
          violation_status,
          barangay,
          city,
          province,
          region,
          date,
          fine_amount,
          apprehending_officer,
          license_number,
          MV_number
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
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
      ];

      const [result] = await db.query(query, values);

      return {
        ...result,
        violation_ticket_id,
      };
    } catch (err) {
      console.log("CREATE VIOLATION ERROR:", err.code, err.message);

      // retry only if auto-generated duplicate
      if (err.code === "ER_DUP_ENTRY" && !data.violation_ticket_id) {
        continue;
      }

      // duplicate manually provided ticket id
      if (err.code === "ER_DUP_ENTRY" && data.violation_ticket_id) {
        const err = new Error("Violation ticket ID already exists");

        err.code = "DUPLICATE_TICKET_ID";

        throw err;
      }

      // missing required fields
      if (err.code === "ER_BAD_NULL_ERROR") {
        const err = new Error("Missing required violation fields");

        err.code = "MISSING_FIELDS";

        throw err;
      }

      throw err;
    }
  }

  throw new Error("Failed to generate unique violation ticket ID");
}

// --- UPDATE VIOLATION
export async function updateViolation(violation_ticket_id, data) {
  // chekc if dirver exists
  if (data.license_number) {
    const [driver] = await db.query(
      `
      SELECT 1
      FROM driver
      WHERE license_number = ?
      LIMIT 1
      `,
      [data.license_number],
    );

    if (!driver.length) {
      const err = new Error("Invalid license_number: driver does not exist");

      err.code = "INVALID_DRIVER";

      throw err;
    }
  }

  // check if vehicle exists
  if (data.MV_number) {
    const [vehicle] = await db.query(
      `
      SELECT 1
      FROM vehicle
      WHERE MV_number = ?
      LIMIT 1
      `,
      [data.MV_number],
    );

    if (!vehicle.length) {
      const err = new Error("Invalid MV_number: vehicle does not exist");

      err.code = "INVALID_VEHICLE";

      throw err;
    }
  }

  const [result] = await db.query(
    `
    UPDATE trafficViolation
    SET
      violation_type = ?,
      violation_status = ?,
      barangay = ?,
      city = ?,
      province = ?,
      region = ?,
      date = ?,
      fine_amount = ?,
      apprehending_officer = ?,
      license_number = ?,
      MV_number = ?
    WHERE
      violation_ticket_id = ?
      AND is_archived = FALSE
    `,
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
    ],
  );

  if (result.affectedRows === 0) {
    const err = new Error("Violation not found");

    err.code = "VIOLATION_NOT_FOUND";

    throw err;
  }

  return result;
}

// --- ARCHIVE ---
export async function archiveViolation(violation_ticket_id) {
  const [result] = await db.query(
    `
    UPDATE trafficViolation
    SET is_archived = TRUE
    WHERE violation_ticket_id = ?
    `,
    [violation_ticket_id],
  );

  return result;
}

// --- UNARCHIVE ---
export async function unarchiveViolation(violation_ticket_id) {
  const [result] = await db.query(
    `
    UPDATE trafficViolation
    SET is_archived = FALSE
    WHERE violation_ticket_id = ?
    `,
    [violation_ticket_id],
  );

  return result;
}

// --- DELETE ---
export async function deleteViolation(violation_ticket_id) {
  const [result] = await db.query(
    `
    DELETE FROM trafficViolation
    WHERE violation_ticket_id = ?
    `,
    [violation_ticket_id],
  );

  return result;
}

// =====================
// REPORTS
// =====================

// --- VIOLATION COUNT PER TYPE ---
export async function getViolationTotalsByType(year) {
  const [rows] = await db.query(
    `
    SELECT
      violation_type,
      COUNT(*) AS total_violations
    FROM trafficViolation
    WHERE YEAR(date) = ?
      AND is_archived = FALSE
    GROUP BY violation_type
    ORDER BY total_violations DESC
    `,
    [year],
  );

  return rows;
}

// --- VEHICLES WITH VIOLATIONS BY LOCATION ---
export async function getViolationsByLocation(region, city, sortBy, order) {
  const orderBy = buildOrderBy(sortBy, order);

  const values = [];

  let query = `
    SELECT
      t.region,
      t.location,
      t.violation_ticket_id,
      v.MV_number,
      v.vehicle_type,
      t.violation_type,
      t.fine_amount,
      t.violation_status
    FROM vehicle v
    LEFT JOIN trafficViolation t
      ON v.MV_number = t.MV_number
    WHERE t.is_archived = FALSE
  `;

  // region
  if (region) {
    query += ` AND t.region = ?`;
    values.push(region);
  }

  // city
  if (city) {
    query += ` AND t.city = ?`;
    values.push(city);
  }

  query += ` ${orderBy}`;

  const [result] = await db.query(query, values);

  return result;
}
