import * as registrationService from "../service/registrationService.js";
import { expireRegistrations } from "../service/maintenanceService.js";

/*
TO DO:

- generate registration number

[ CRUD ]
- getAllRegistration (DONE)
- searchRegistration (ORDER)
- createRegistration (DONE)
- updateRegistration (DONE)
- renewRegistation (DONE)

[ REPORTS ]
 - View all vehicles with expired registrations as of a given date. (ORDER)
 - getVehicleRegistrationHistory (ORDER)
*/

// =====================
// CRUD
// =====================

// --- GET ALL REGISTRATION ---
export const getAllRegistrations = async (req, res) => {
  try {
    const { sortBy, order } = req.query;

    const result = await registrationService.getAllRegistrations(sortBy, order);

    if (!result.length) {
      return res.status(404).json({
        message: "No registrations found",
      });
    }

    res.json(result);
  } catch (err) {
    console.error("GET REGISTRATIONS ERROR:", err);

    res.status(500).json({
      message: "Failed to fetch registrations",
      error: err.message,
    });
  }
};

// --- SEARCH REGISTRATION ---
export const searchRegistrations = async (req, res) => {
  try {
    const { keyword, sortBy, order, MV_number, expired, date } = req.query;

    const filters = {
      keyword,
      sortBy,
      order,
      MV_number,
      expired: expired === "true",
      date,
    };

    const result = await registrationService.searchRegistrations(
      filters,
      sortBy,
      order,
    );

    if (!result.length) {
      return res.status(404).json({
        message: "No registrations found",
      });
    }

    res.json(result);
  } catch (err) {
    console.error("GET REGISTRATIONS ERROR:", err);

    res.status(500).json({
      message: "Failed to fetch registrations",
      error: err.message,
    });
  }
};

// --- CREATE REGISTATION ---
export const createRegistration = async (req, res) => {
  try {
    const result = await registrationService.createRegistration(req.body);

    res.status(201).json({
      message: "Registration created successfully",
      result,
    });
  } catch (err) {
    console.error("CREATE REGISTRATION ERROR:", err);

    // vehicle already has active registration
    if (err.code === "ACTIVE_REGISTRATION_EXISTS") {
      return res.status(409).json({
        message: err.message,
      });
    }

    // invalid registration format
    if (err.code === "INVALID_REGISTRATION_FORMAT") {
      return res.status(400).json({
        message: err.message,
      });
    }

    // duplicate registration number (manual input)
    if (err.code === "DUPLICATE_REGISTRATION_NUMBER") {
      return res.status(409).json({
        message: err.message,
      });
    }

    // missing required fields (MySQL constraint)
    if (err.code === "ER_BAD_NULL_ERROR") {
      return res.status(400).json({
        message: "Missing required field",
        error: err.sqlMessage,
      });
    }

    res.status(500).json({
      message: "Failed to create registration",
      error: err.message,
    });
  }
};

// --- UPDATE REGISTRATION ---
export const updateRegistration = async (req, res) => {
  try {
    const result = await registrationService.updateRegistration(
      req.params.registration_number,
      req.body,
    );

    res.json({
      message: "Registration updated successfully",
      result,
    });
  } catch (err) {
    console.error("UPDATE REGISTRATION ERROR:", err);

    if (err.code === "REGISTRATION_NOT_FOUND") {
      return res.status(404).json({
        message: err.message,
      });
    }

    res.status(500).json({
      message: "Failed to update registration",
      error: err.message,
    });
  }
};

// --- DELETE REGISTRATION ---
export const deleteRegistration = async (req, res) => {
  try {
    const result = await registrationService.deleteRegistration(
      req.params.registration_number,
    );

    res.json({
      message: "Registration deleted successfully",
    });
  } catch (err) {
    console.error("DELETE REGISTRATION ERROR:", err);

    if (err.code === "REGISTRATION_NOT_FOUND") {
      return res.status(404).json({
        message: err.message,
      });
    }

    res.status(500).json({
      message: "Failed to delete registration",
      error: err.message,
    });
  }
};

// --- RENEW REGISTRATION ---
export const renewRegistration = async (req, res) => {
  try {
    const result = await registrationService.renewRegistration(req.body);

    res.json({
      message: "Vehicle registration renewed successfully",
      result,
    });
  } catch (err) {
    console.error("RENEW REGISTRATION ERROR:", err);

    if (err.code === "VEHICLE_NOT_FOUND") {
      return res.status(404).json({
        message: err.message,
      });
    }

    if (err.code === "ACTIVE_REGISTRATION_EXISTS") {
      return res.status(409).json({
        message: err.message,
      });
    }

    res.status(500).json({
      message: "Failed to renew registration",
      error: err.message,
    });
  }
};
