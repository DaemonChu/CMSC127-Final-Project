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

// === CRUD ===
router.get("/", getAllVehicles);
router.get("/archived", getAllArchivedVehicles);
router.get("/search", searchVehicles);
router.post("/", createVehicle);
router.patch("/:MV_number", updateVehicle);
router.patch("/archive/:MV_number", archiveVehicle);
router.patch("/unarchive/:MV_number", unarchiveVehicle);
router.delete("/:MV_number", deleteVehicle);

// === SEARCH + VEHICLE REPORTS ===
router.get("/search", searchVehicles);

export default router;
