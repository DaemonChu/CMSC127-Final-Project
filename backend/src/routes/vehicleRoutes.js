import express from "express";
import {
  getAllVehicles,
  getAllArchivedVehicles,
  searchVehicles,
  createVehicle,
  updateVehicle,
  archiveVehicle,
  unarchiveVehicle,
  deleteVehicle,
} from "../controllers/vehicleController.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────
//  IMPORTANT: static/specific paths MUST come before parametric
//  ones (/:MV_number) or Express will swallow them.
// ─────────────────────────────────────────────────────────────

// === SEARCH + REPORT ROUTES (static — before /:MV_number) ===
router.get("/search",          searchVehicles);
router.get("/archived",        getAllArchivedVehicles);

// === REPORT ROUTES ===
// "Vehicles by Driver" — reuses searchVehicles with ?license_number= filter
// Routes to the same searchVehicles handler; Reports.jsx sends ?license_number=
router.get("/reports/by-driver", searchVehicles); // ?license_number=

// === CRUD ===
router.get("/",                              getAllVehicles);
router.post("/",                             createVehicle);
router.patch("/archive/:MV_number",          archiveVehicle);
router.patch("/unarchive/:MV_number",        unarchiveVehicle);
router.patch("/:MV_number",                  updateVehicle);
router.delete("/:MV_number",                 deleteVehicle);

export default router;