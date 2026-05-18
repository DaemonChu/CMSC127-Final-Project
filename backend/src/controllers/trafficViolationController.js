import * as trafficViolationService from "../service/trafficViolationServices.js";

/*
TO DO:

[ CRUD ]
- get all violations
- search
- create violation
- update violation
- archive
- unarchive
- delete

[ REPORTS ]
 - View all traffic violations committed by a given driver within a specified date range.violation
 - View the total number of violations per violation type for a given year. violation
 - View all vehicles involved in violations within a given city or region. violation
 */

// =====================
// CRUD
// =====================

// --- GET ALL VIOLATIONS ---
export const getAllViolations = async (req, res) => {
  try {
    const { sortBy, order } = req.query;

    const result = await trafficViolationService.getAllViolations(
      sortBy,
      order,
    );

    if (!result.length) {
      return res.status(404).json({
        message: "No violations found",
      });
    }

    res.json(result);
  } catch (err) {
    console.error("GET ALL VIOLATIONS ERROR:", err);

    res.status(500).json({
      message: "Failed to fetch violations",
      error: err.message,
    });
  }
};

// --- GET ARCHIVED VIOLATIONS ---
export const getAllArchivedViolations = async (req, res) => {
  try {
    const { sortBy, order } = req.query;

    const result = await trafficViolationService.getAllArchivedViolations(
      sortBy,
      order,
    );

    if (!result.length) {
      return res.status(404).json({
        message: "No archived violations found",
      });
    }

    res.json(result);
  } catch (err) {
    console.error("GET ARCHIVED VIOLATIONS ERROR:", err);

    res.status(500).json({
      message: "Failed to fetch archived violations",
      error: err.message,
    });
  }
};

// --- SEARCH VIOLATIONS ---
export const searchViolations = async (req, res) => {
  try {
    const {
      keyword,
      isArchived,
      license_number,
      MV_number,
      startDate,
      endDate,
      sortBy,
      order,
    } = req.query;

    const filters = {
      keyword,
      isArchived: isArchived === undefined ? undefined : isArchived === "true",
      license_number,
      MV_number,
      startDate,
      endDate,
    };

    const result = await trafficViolationService.searchViolations(
      filters,
      sortBy,
      order,
    );

    if (!result.length) {
      return res.status(404).json({
        message: "No violations found",
      });
    }

    res.json(result);
  } catch (err) {
    console.error("GET VIOLATIONS ERROR:", err);

    res.status(500).json({
      message: "Failed to fetch violations",
      error: err.message,
    });
  }
};

// --- CREATE VIOLATION ---
export const createViolation = async (req, res) => {
  try {
    const result = await trafficViolationService.createViolation(req.body);

    res.status(201).json({
      message: "Violation created successfully",
      result,
    });
  } catch (err) {
    console.error("CREATE VIOLATION ERROR:", err);

    // invalid ticket format
    if (err.code === "INVALID_TICKET_FORMAT") {
      return res.status(400).json({
        message: err.message,
      });
    }

    // driver does not exist
    if (err.code === "INVALID_DRIVER") {
      return res.status(400).json({
        message: err.message,
      });
    }

    // vehicle does not exist
    if (err.code === "INVALID_VEHICLE") {
      return res.status(400).json({
        message: err.message,
      });
    }

    // duplicate ticket id (manual input)
    if (err.code === "DUPLICATE_TICKET_ID") {
      return res.status(409).json({
        message: err.message,
      });
    }

    // missing required fields
    if (err.code === "MISSING_FIELDS") {
      return res.status(400).json({
        message: err.message,
        error: err.sqlMessage,
      });
    }

    res.status(500).json({
      message: "Failed to create violation",
      error: err.message,
    });
  }
};

// --- UPDATE VIOLATION ---
export const updateViolation = async (req, res) => {
  try {
    const { violation_ticket_id } = req.params;

    const result = await trafficViolationService.updateViolation(
      violation_ticket_id,
      req.body,
    );

    // violation not found
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Violation not found",
      });
    }

    res.json({
      message: "Violation updated successfully",
      result,
    });
  } catch (err) {
    console.error("UPDATE VIOLATION ERROR:", err);

    // invalid driver
    if (err.code === "INVALID_DRIVER") {
      return res.status(400).json({
        message: err.message,
      });
    }

    // invalid vehicle
    if (err.code === "INVALID_VEHICLE") {
      return res.status(400).json({
        message: err.message,
      });
    }

    // violation not found (service-level safety)
    if (err.code === "VIOLATION_NOT_FOUND") {
      return res.status(404).json({
        message: err.message,
      });
    }

    res.status(500).json({
      message: "Failed to update violation",
      error: err.message,
    });
  }
};

// --- ARCHIVE VIOLATION ---
export const archiveViolation = async (req, res) => {
  try {
    const { violation_ticket_id } = req.params;

    const result =
      await trafficViolationService.archiveViolation(violation_ticket_id);

    // violation not found
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Violation not found",
      });
    }

    res.json({
      message: "Violation archived successfully",
      result,
    });
  } catch (err) {
    console.error("ARCHIVE VIOLATION ERROR:", err);

    res.status(500).json({
      message: "Failed to archive violation",
      error: err.message,
    });
  }
};

// --- UNARCHIVE VIOLATION ---
export const unarchiveViolation = async (req, res) => {
  try {
    const { violation_ticket_id } = req.params;

    const result =
      await trafficViolationService.unarchiveViolation(violation_ticket_id);

    // violation not found
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Violation not found",
      });
    }

    res.json({
      message: "Violation unarchived successfully",
      result,
    });
  } catch (err) {
    console.error("UNARCHIVE VIOLATION ERROR:", err);

    res.status(500).json({
      message: "Failed to unarchive violation",
      error: err.message,
    });
  }
};

// --- DELETE VIOLATION ---
export const deleteViolation = async (req, res) => {
  try {
    const { violation_ticket_id } = req.params;

    const result =
      await trafficViolationService.deleteViolation(violation_ticket_id);

    // violation not found
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Violation not found",
      });
    }

    res.json({
      message: "Violation permanently deleted",
      result,
    });
  } catch (err) {
    console.error("DELETE VIOLATION ERROR:", err);

    res.status(500).json({
      message: "Failed to delete violation",
      error: err.message,
    });
  }
};

// =====================
// REPORTS
// =====================

// --- VIOLATION TOTALS PER TYPE ---
export const getViolationTotalsByType = async (req, res) => {
  try {
    const { year } = req.params;

    if (!year) {
      return res.status(400).json({
        message: "Year is required",
      });
    }

    const result = await trafficViolationService.getViolationTotalsByType(year);

    if (!result.length) {
      return res.status(404).json({
        message: "No violation data found for this year",
      });
    }

    res.json(result);
  } catch (err) {
    console.error("VIOLATION TYPE REPORT ERROR:", err);

    res.status(500).json({
      message: "Failed to fetch violation totals",
      error: err.message,
    });
  }
};

// --- VEHICLES WITH VIOLATIONS BY LOCATION ---
export const getViolationsByLocation = async (req, res) => {
  try {
    const { region, city, sortBy, order } = req.query;

    const result = await trafficViolationService.getViolationsByLocation(
      region,
      city,
      sortBy,
      order,
    );

    // no records found
    if (!result.length) {
      return res.status(404).json({
        message: "No violation records found",
      });
    }

    res.json(result);
  } catch (err) {
    console.error("GET VEHICLES VIOLATIONS BY REGION/CITY ERROR:", err);

    res.status(500).json({
      message: "Failed to fetch violation records",
      error: err.message,
    });
  }
};
