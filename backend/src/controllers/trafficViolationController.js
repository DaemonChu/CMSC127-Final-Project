// src/controllers/trafficViolationController.js
import * as trafficViolationService from "../service/trafficViolationServices.js";

// ─────────────────────────────────────────────
//  CRUD
// ─────────────────────────────────────────────

// GET /api/violations?type=&status=&sortBy=&order=
export const getAllViolations = async (req, res) => {
  try {
    const { type, status, sortBy, order } = req.query;

    // Pass type + status as a filters object so the service can build
    // optional WHERE clauses — all three can be combined freely
    const result = await trafficViolationService.getAllViolations(
      { type, status },
      sortBy,
      order
    );

    if (!result.length) {
      return res.status(404).json({ message: "No violations found" });
    }

    res.json(result);
  } catch (err) {
    console.error("GET ALL VIOLATIONS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch violations", error: err.message });
  }
};

// GET /api/violations/archived?type=&status=&sortBy=&order=
export const getAllArchivedViolations = async (req, res) => {
  try {
    const { type, status, sortBy, order } = req.query;

    const result = await trafficViolationService.getAllArchivedViolations(
      { type, status },
      sortBy,
      order
    );

    if (!result.length) {
      return res.status(404).json({ message: "No archived violations found" });
    }

    res.json(result);
  } catch (err) {
    console.error("GET ARCHIVED VIOLATIONS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch archived violations", error: err.message });
  }
};

// GET /api/violations/search?keyword=&isArchived=&type=&status=&sortBy=&order=
export const searchViolations = async (req, res) => {
  try {
    const { keyword, isArchived, type, status, sortBy, order } = req.query;

    const filters = {
      keyword,
      isArchived: isArchived === undefined ? undefined : isArchived === "true",
      type,
      status,
    };

    const result = await trafficViolationService.searchViolations(filters, sortBy, order);

    if (!result.length) {
      return res.status(404).json({ message: "No violations found" });
    }

    res.json(result);
  } catch (err) {
    console.error("SEARCH VIOLATIONS ERROR:", err);
    res.status(500).json({ message: "Failed to search violations", error: err.message });
  }
};

// POST /api/violations
export const createViolation = async (req, res) => {
  try {
    const result = await trafficViolationService.createViolation(req.body);
    res.status(201).json({ message: "Violation created successfully", result });
  } catch (err) {
    console.error("CREATE VIOLATION ERROR:", err);

    const clientErrors = {
      INVALID_TICKET_FORMAT: 400,
      INVALID_DRIVER:        400,
      INVALID_VEHICLE:       400,
      MISSING_FIELDS:        400,
      DUPLICATE_TICKET_ID:   409,
    };

    const status = clientErrors[err.code] ?? 500;
    res.status(status).json({ message: err.message });
  }
};

// PATCH /api/violations/:violation_ticket_id
export const updateViolation = async (req, res) => {
  try {
    const { violation_ticket_id } = req.params;
    const result = await trafficViolationService.updateViolation(violation_ticket_id, req.body);

    res.json({ message: "Violation updated successfully", result });
  } catch (err) {
    console.error("UPDATE VIOLATION ERROR:", err);

    if (err.code === "INVALID_DRIVER")       return res.status(400).json({ message: err.message });
    if (err.code === "INVALID_VEHICLE")      return res.status(400).json({ message: err.message });
    if (err.code === "VIOLATION_NOT_FOUND")  return res.status(404).json({ message: err.message });

    res.status(500).json({ message: "Failed to update violation", error: err.message });
  }
};

// PATCH /api/violations/archive/:violation_ticket_id
export const archiveViolation = async (req, res) => {
  try {
    const { violation_ticket_id } = req.params;
    const result = await trafficViolationService.archiveViolation(violation_ticket_id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Violation not found" });
    }

    res.json({ message: "Violation archived successfully" });
  } catch (err) {
    console.error("ARCHIVE VIOLATION ERROR:", err);
    res.status(500).json({ message: "Failed to archive violation", error: err.message });
  }
};

// PATCH /api/violations/unarchive/:violation_ticket_id
export const unarchiveViolation = async (req, res) => {
  try {
    const { violation_ticket_id } = req.params;
    const result = await trafficViolationService.unarchiveViolation(violation_ticket_id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Violation not found" });
    }

    res.json({ message: "Violation unarchived successfully" });
  } catch (err) {
    console.error("UNARCHIVE VIOLATION ERROR:", err);
    res.status(500).json({ message: "Failed to unarchive violation", error: err.message });
  }
};

// DELETE /api/violations/:violation_ticket_id
export const deleteViolation = async (req, res) => {
  try {
    const { violation_ticket_id } = req.params;
    const result = await trafficViolationService.deleteViolation(violation_ticket_id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Violation not found" });
    }

    res.json({ message: "Violation permanently deleted" });
  } catch (err) {
    console.error("DELETE VIOLATION ERROR:", err);
    res.status(500).json({ message: "Failed to delete violation", error: err.message });
  }
};

// ─────────────────────────────────────────────
//  REPORTS
// ─────────────────────────────────────────────

// GET /api/violations/reports/by-type?year=2024
// (was /reports/types/:year — changed to query param to match Reports.jsx)
export const getViolationTotalsByType = async (req, res) => {
  try {
    const { year } = req.query; // read from ?year= not :year

    if (!year) {
      return res.status(400).json({ message: "Year is required (?year=YYYY)" });
    }

    const result = await trafficViolationService.getViolationTotalsByType(year);

    if (!result.length) {
      return res.status(404).json({ message: "No violation data found for this year" });
    }

    res.json(result);
  } catch (err) {
    console.error("VIOLATION TYPE REPORT ERROR:", err);
    res.status(500).json({ message: "Failed to fetch violation totals", error: err.message });
  }
};

// GET /api/violations/reports/by-driver?license_number=...&from=YYYY-MM-DD&to=YYYY-MM-DD
// NEW — was missing entirely
export const getViolationsByDriver = async (req, res) => {
  try {
    const { license_number, from, to } = req.query;

    if (!license_number) {
      return res.status(400).json({ message: "license_number is required" });
    }

    const result = await trafficViolationService.getViolationsByDriver(
      license_number,
      from,
      to
    );

    if (!result.length) {
      return res.status(404).json({ message: "No violations found for this driver" });
    }

    res.json(result);
  } catch (err) {
    console.error("VIOLATIONS BY DRIVER REPORT ERROR:", err);
    res.status(500).json({ message: "Failed to fetch violations by driver", error: err.message });
  }
};

// GET /api/violations/reports/vehicles-by-city?city=...
// (was /reports/vehicles/location — renamed to match Reports.jsx)
export const getViolationsByLocation = async (req, res) => {
  try {
    const { city, region, sortBy, order } = req.query;

    const result = await trafficViolationService.getViolationsByLocation(
      city,
      region,
      sortBy,
      order
    );

    if (!result.length) {
      return res.status(404).json({ message: "No violations found for this location" });
    }

    res.json(result);
  } catch (err) {
    console.error("VIOLATIONS BY LOCATION REPORT ERROR:", err);
    res.status(500).json({ message: "Failed to fetch violations by location", error: err.message });
  }
};