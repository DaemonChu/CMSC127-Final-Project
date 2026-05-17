import * as driverService from "../service/driverService.js";
import { expireDrivers } from "../service/maintenanceService.js";

/*
TO DO:

[ CRUD ]
- getAllDrivers (DONE)
- getAllArchivedDrivers (DONE)
- createDriver (DONE)
- searchDriver (DONE)
- updateDriver (DONE; do refresh @ UI)
- removeDriver (DONE)
- archiveDriver (DONE)
- unarchiveDriver (DONE)

[ REPORTS ]
 - View all registered drivers filtered by: License type, License status, Age range, Sex (DONE)
 - View all drivers with expired or suspended licenses. (DONE)
 - OPTIONAL : filter age asc desc (DONE; ALL)
*/

// =====================
// CRUD
// =====================

// --- GET ALL DRIVERS ---
export const getAllDrivers = async (req, res) => {
  try {
    const { sortBy, order } = req.query;

    const data = await driverService.getAllDrivers(sortBy, order);

    if (!data.length) {
      return res.status(404).json({
        message: "No drivers found",
      });
    }

    res.json(data);
  } catch (err) {
    console.error("GET ALL DRIVERS ERROR:", err);

    res.status(500).json({
      message: "Failed to fetch drivers",
      error: err.message,
    });
  }
};

// --- GET ARCHIVED DRIVERS ---
export const getAllArchivedDrivers = async (req, res) => {
  try {
    const { sortBy, order } = req.query;

    const data = await driverService.getAllArchivedDrivers(sortBy, order);

    if (!data.length) {
      return res.status(404).json({ message: "No archived drivers found" });
    }

    res.json(data);
  } catch (err) {
    console.error("GET ALL ARCHIVED DRIVERS ERROR:", err);

    res.status(500).json({
      message: "Failed to fetch archived drivers",
      error: err.message,
    });
  }
};

// --- SEARCH DRIVERS (ACTIVE / ARCHIVED) ---
export const searchDrivers = async (req, res) => {
  try {
    const { keyword = "", archived = "false" } = req.query;

    const isArchived = archived === "true";

    const result = await driverService.searchDrivers(keyword, isArchived);

    if (!result.length) {
      return res.status(404).json({
        message: "No drivers found",
      });
    }

    res.json({
      message: "Driver(s) found",
      result,
    });
  } catch (err) {
    console.error("SEARCH DRIVER ERROR:", err);

    res.status(500).json({
      message: "Search failed",
      error: err.message,
    });
  }
};

// --- CREATE DRIVER ---
export const createDriver = async (req, res) => {
  try {
    const result = await driverService.createDriver(req.body);

    // run maintenance
    await expireDrivers();

    res.json({
      message: "Driver created successfully",
      result,
    });
  } catch (err) {
    console.error("CREATE DRIVER ERROR:", err);

    // ERROR: duplicate entry
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Driver already exists (duplicate license number)",
      });
    }

    // ERROR: missing required fields from MySQL
    if (err.code === "ER_BAD_NULL_ERROR") {
      return res.status(400).json({
        message: "Missing required field",
        error: err.sqlMessage,
      });
    }

    res.status(500).json({
      message: "Failed to create driver",
      error: err.message,
    });
  }
};

// --- UPDATE DRIVER ---
export const updateDriver = async (req, res) => {
  try {
    const result = await driverService.updateDriver(
      req.params.license_number,
      req.body,
    );

    // ERROR: no rows affected (driver not found)
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    // run maintenance
    await expireDrivers();

    res.json({
      message: "Driver updated successfully",
      result,
    });
  } catch (err) {
    console.error("UPDATE DRIVER ERROR:", err);

    res.status(500).json({
      message: "Failed to update driver",
      error: err.message,
    });
  }
};

// --- ARCHIVE DRIVER ---
export const archiveDriver = async (req, res) => {
  try {
    const result = await driverService.archiveDriver(req.params.license_number);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json({ message: "Driver archived successfully" });
  } catch (err) {
    console.error("ARCHIVE DRIVER ERROR:", err);

    res.status(500).json({
      message: "Failed to archive driver",
      error: err.message,
    });
  }
};

// --- UNARCHIVE DRIVER ---
export const unarchiveDriver = async (req, res) => {
  try {
    const result = await driverService.unarchiveDriver(
      req.params.license_number,
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json({ message: "Driver unarchived successfully" });
  } catch (err) {
    console.error("UNARCHIVE DRIVER ERROR:", err);

    res.status(500).json({
      message: "Failed to unarchive driver",
      error: err.message,
    });
  }
};

// (!! FIX: UI PEOPLE, PLEASE PLEASE DO USER CONFIRMATION SINCE THIS DELETES EVERY TRACE OF A DRIVER)
// --- DELETE DRIVER ---
export const deleteDriver = async (req, res) => {
  try {
    const result = await driverService.deleteDriver(req.params.license_number);

    // ERROR: driver not found
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    res.json({
      message: "Driver permanently deleted",
    });
  } catch (err) {
    console.error("DELETE DRIVER ERROR:", err);

    res.status(500).json({
      message: "Failed to delete driver",
      error: err.message,
    });
  }
};

// =====================
// REPORT
// =====================

// --- VIEW DRIVERS (FILTERED BY) ---

// license type
export const getDriversByLicenseType = async (req, res) => {
  try {
    const { type, sortBy, order } = req.query;

    // validation
    if (!type) {
      return res.status(400).json({
        message: "License type is required",
      });
    }

    const result = await driverService.getByLicenseType(type, sortBy, order);

    if (result.length === 0) {
      return res.status(404).json({
        message: "No drivers found for this license type",
      });
    }

    res.json(result);
  } catch (err) {
    console.error("LICENSE TYPE REPORT ERROR:", err);

    res.status(500).json({
      message: "Failed to fetch drivers by license type",
      error: err.message,
    });
  }
};

// status
export const getDriversByStatus = async (req, res) => {
  try {
    const { status, sortBy, order } = req.query;

    // validation
    if (!status) {
      return res.status(400).json({
        message: "License status is required",
      });
    }

    const result = await driverService.getByStatus(status, sortBy, order);

    if (result.length === 0) {
      return res.status(404).json({
        message: "No drivers found for this status",
      });
    }

    res.json(result);
  } catch (err) {
    console.error("STATUS REPORT ERROR:", err);

    res.status(500).json({
      message: "Failed to fetch drivers by status",
      error: err.message,
    });
  }
};

// age range
export const getDriversByAgeRange = async (req, res) => {
  try {
    const { min, max, sortBy, order } = req.query;

    // validation
    if (!min || !max) {
      return res.status(400).json({
        message: "Minimum and maximum age are required",
      });
    }

    const result = await driverService.getByAgeRange(min, max, sortBy, order);

    if (result.length === 0) {
      return res.status(404).json({
        message: "No drivers found within this age range",
      });
    }

    res.json(result);
  } catch (err) {
    console.error("AGE RANGE REPORT ERROR:", err);

    res.status(500).json({
      message: "Failed to fetch drivers by age range",
      error: err.message,
    });
  }
};

// sex
export const getDriversBySex = async (req, res) => {
  try {
    const { sex, sortBy, order } = req.query;

    // validation (hell nah)
    if (!sex) {
      return res.status(400).json({
        message: "Sex is required",
      });
    }

    const result = await driverService.getBySex(sex, sortBy, order);

    if (result.length === 0) {
      return res.status(404).json({
        message: "No drivers found for this sex",
      });
    }

    res.json(result);
  } catch (err) {
    console.error("SEX REPORT ERROR:", err);

    res.status(500).json({
      message: "Failed to fetch drivers by sex",
      error: err.message,
    });
  }
};

// --- VIEW ALL DRIVERS (EXPIRED / SUSPENDED) ---
export const getDriversWithBadStatus = async (req, res) => {
  try {
    const { sortBy, order } = req.query;

    const result = await driverService.getDriversWithBadStatus(sortBy, order);

    if (result.length === 0) {
      return res.status(404).json({
        message: "No expired or suspended drivers found",
      });
    }

    res.json(result);
  } catch (err) {
    console.error("BAD STATUS REPORT ERROR:", err);

    res.status(500).json({
      message: "Failed to fetch expired/suspended drivers",
      error: err.message,
    });
  }
};
