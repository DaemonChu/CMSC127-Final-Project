import * as vehicleService from "../service/vehicleService.js";

/*
TO DO:

[ CRUD ]
- getAllVehicles (DONE)
- getAllArhivedVehicles
- searchVehicle (DONE)
- createVehicle (DONE)
- updateVehicle (DONE)
- archiveVehicle (DONE)
- unarchiveVehicle (DONE)
- removeVehicle (DONE)

[ REPORTS ]
- View all vehicles owned by a given driver.
*/

// =====================
// CRUD
// =====================

// --- GET ALL VEHICLES ---
export const getAllVehicles = async (req, res) => {
  try {
    const { sortBy, order } = req.query;

    const result = await vehicleService.getAllVehicles(sortBy, order);

    if (!result.length) {
      return res.status(404).json({
        message: "No vehicles found",
      });
    }

    res.json(result);
  } catch (err) {
    console.error("GET ALL VEHICLES ERROR:", err);

    res.status(500).json({
      message: "Failed to fetch vehicles",
      error: err.message,
    });
  }
};

// --- GET ALL ARCHIVED VEHICLES ---
export const getAllArchivedVehicles = async (req, res) => {
  try {
    const { sortBy, order } = req.query;

    const result = await vehicleService.getAllArchivedVehicles(sortBy, order);

    if (!result.length) {
      return res.status(404).json({
        message: "No archived vehicles found",
      });
    }

    res.json(result);
  } catch (err) {
    console.error("GET ALL ARCHIVED VEHICLES ERROR:", err);

    res.status(500).json({
      message: "Failed to fetch archived vehicles",
      error: err.message,
    });
  }
};

// --- SEARCH VEHICLES + REPORT (driver filter) ---
export const searchVehicles = async (req, res) => {
  try {
    const { keyword, license_number, vehicleType, isArchived, sortBy, order } = req.query;

    const result = await vehicleService.searchVehicles(
      keyword,
      license_number,
      vehicleType,     // added
      isArchived,
      sortBy,
      order,
    );

    if (!result.length) {
      return res.status(404).json({ message: "No vehicles found" });
    }

    res.json(result);
  } catch (err) {
    console.error("SEARCH VEHICLES ERROR:", err);
    res.status(500).json({ message: "Failed to fetch vehicles", error: err.message });
  }
};

// --- CREATE VEHICLE ---
export const createVehicle = async (req, res) => {
  try {
    const result = await vehicleService.createVehicle(req.body);

    res.status(201).json({
      message: "Vehicle created successfully",
      result,
    });
  } catch (err) {
    console.error("CREATE VEHICLE ERROR:", err);

    // duplicate MV number
    if (err.code === "DUPLICATE_MV_NUMBER") {
      return res.status(409).json({
        message: err.message,
      });
    }

    // invalid format
    if (err.code === "INVALID_MV_FORMAT") {
      return res.status(400).json({
        message: err.message,
      });
    }

    // missing fields
    if (err.code === "MISSING_FIELDS") {
      return res.status(400).json({
        message: err.message,
        error: err.sqlMessage,
      });
    }

    res.status(500).json({
      message: "Failed to create vehicle",
      error: err.message,
    });
  }
};

// --- UPDATE VEHICLE ---
export const updateVehicle = async (req, res) => {
  try {
    const result = await vehicleService.updateVehicle(
      req.params.MV_number,
      req.body,
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    res.json({
      message: "Vehicle updated successfully",
      result,
    });
  } catch (err) {
    console.error("UPDATE VEHICLE ERROR:", err);

    if (err.code === "VEHICLE_NOT_FOUND") {
      return res.status(404).json({
        message: err.message,
      });
    }

    if (err.code === "INVALID_LICENSE_NUMBER") {
      return res.status(400).json({
        message: err.message,
      });
    }

    res.status(500).json({
      message: "Failed to update vehicle",
      error: err.message,
    });
  }
};

// --- ARCHIVE VEHICLE ---
export const archiveVehicle = async (req, res) => {
  try {
    const result = await vehicleService.archiveVehicle(req.params.MV_number);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json({
      message: "Vehicle archived successfully",
    });
  } catch (err) {
    console.error("ARCHIVE VEHICLE ERROR:", err);

    res.status(500).json({
      message: "Failed to archive vehicle",
      error: err.message,
    });
  }
};

// --- UNARCHIVE VEHICLE ---
export const unarchiveVehicle = async (req, res) => {
  try {
    const result = await vehicleService.unarchiveVehicle(req.params.MV_number);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json({
      message: "Vehicle unarchived successfully",
    });
  } catch (err) {
    console.error("UNARCHIVE VEHICLE ERROR:", err);

    res.status(500).json({
      message: "Failed to unarchive vehicle",
      error: err.message,
    });
  }
};

// --- REMOVE VEHICLE ---
export const deleteVehicle = async (req, res) => {
  try {
    const result = await vehicleService.deleteVehicle(req.params.MV_number);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    res.json({
      message: "Vehicle deleted successfully",
    });
  } catch (err) {
    console.error("DELETE VEHICLE ERROR:", err);

    res.status(500).json({
      message: "Failed to delete vehicle",
      error: err.message,
    });
  }
};
