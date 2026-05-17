import * as vehicleService from "../service/vehicleService.js";

/*
TO DO:

[ CRUD ]
- getAllVehicles (DONE)
- getAllArhivedVehicles
- searchVehicle (DONE)
- createVehicle (DONE)
- updateVehicle (DONE)
- removeVehicle (DONE)
- unarchiveVehicle (DONE)
- removeVehicle (DONE)

[ REPORTS ]

*/

// =====================
// CRUD
// =====================

// --- GET ALL VEHICLES ---
export const getAllVehicles = async (req, res) => {
  try {
    const { sortBy, order } = req.query;

    const data = await vehicleService.getAllVehicles(sortBy, order);

    if (!data.length) {
      return res.status(404).json({ message: "No vehicles found" });
    }

    res.json(data);
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

    const data = await vehicleService.getAllArchivedVehicles(sortBy, order);

    if (!data.length) {
      return res.status(404).json({ message: "No archived vehicles found" });
    }

    res.json(data);
  } catch (err) {
    console.error("GET ALL ARCHIVED VEHICLES ERROR:", err);

    res.status(500).json({
      message: "Failed to fetch archived vehicles",
      error: err.message,
    });
  }
};

// --- SEARCH VEHICLES (ACTIVE / ARCHIVED) ---
export const searchVehicles = async (req, res) => {
  try {
    const { keyword = "", archived = "false" } = req.query;

    const isArchived = archived === "true";

    const result = await vehicleService.searchVehicles(keyword, isArchived);

    if (!result.length) {
      return res.status(404).json({ message: "No vehicle found" });
    }

    res.json({
      message: "Vehicle(s) found",
      result,
    });
  } catch (err) {
    console.error("SEARCH VEHICLES ERROR:", err);

    res.status(500).json({
      message: "Search failed",
      error: err.message,
    });
  }
};

// --- CREATE VEHICLE ---
export const createVehicle = async (req, res) => {
  try {
    const result = await vehicleService.createVehicle(req.body);

    res.json({
      message: "Vehicle created successfully",
      result,
    });
  } catch (err) {
    console.error("CREATE VEHICLE ERROR:", err);

    // duplicate primary key
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Vehicle already exists (duplicate plate number)",
      });
    }

    // foreign key fails
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        message: "Driver does not exist",
      });
    }

    // missing required field
    if (err.code === "ER_BAD_NULL_ERROR") {
      return res.status(400).json({
        message: "Missing required field",
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
      req.params.plate_number,
      req.body,
    );

    // vehicle not found
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json({
      message: "Vehicle updated successfully",
      result,
    });
  } catch (err) {
    console.error("UPDATE VEHICLE ERROR:", err);

    res.status(500).json({
      message: "Failed to update vehicle",
      error: err.message,
    });
  }
};

// --- ARCHIVE VEHICLE ---
export const archiveVehicle = async (req, res) => {
  try {
    const result = await vehicleService.archiveVehicle(req.params.plate_number);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "vehicle not found" });
    }

    res.json({ message: "Vehicle archived successfully" });
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
    const result = await vehicleService.unarchiveVehicle(
      req.params.plate_number,
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json({ message: "Vehicle unarchived successfully" });
  } catch (err) {
    console.error("UNARCHIVE VEHICLE ERROR:", err);

    res.status(500).json({
      message: "Failed to unarchive vehicle",
      error: err.message,
    });
  }
};

// --- DELETE VEHICLE ---
export const deleteVehicle = async (req, res) => {
  try {
    const result = await vehicleService.deleteVehicle(req.params.plate_number);

    // vehicle not found
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

// =====================
// REPORT
// =====================
