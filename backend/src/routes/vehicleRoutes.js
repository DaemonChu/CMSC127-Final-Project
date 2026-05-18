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
router.patch("/:plate_number", updateVehicle);
router.patch("/archive/:plate_number", archiveVehicle);
router.patch("/unarchive/:plate_number", unarchiveVehicle);
router.delete("/:plate_number", deleteVehicle);

// == REPORT ==

export default router;
