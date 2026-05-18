import express from "express";
import {
  getAllDrivers,
  getAllArchivedDrivers,
  createDriver,
  updateDriver,
  renewDriver,
  archiveDriver,
  unarchiveDriver,
  deleteDriver,
  searchDrivers,
} from "../controllers/driverController.js";

const router = express.Router();

// === CRUD ===
router.get("/", getAllDrivers);
router.get("/archived", getAllArchivedDrivers);
router.post("/", createDriver);
router.patch("/:license_number", updateDriver);
router.patch("/renew/:license_number", renewDriver);
router.patch("/archive/:license_number", archiveDriver);
router.patch("/unarchive/:license_number", unarchiveDriver);
router.delete("/:license_number", deleteDriver);

// === SEARCH + DRIVER REPORTS ===
router.get("/search", searchDrivers);

export default router;
