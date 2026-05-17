import express from "express";
import {
  getAllDrivers,
  getAllArchivedDrivers,
  createDriver,
  updateDriver,
  archiveDriver,
  unarchiveDriver,
  deleteDriver,
  searchDrivers,
  getDriversByLicenseType,
  getDriversByStatus,
  getDriversByAgeRange,
  getDriversBySex,
  getDriversWithBadStatus,
} from "../controllers/driverController.js";

const router = express.Router();

// === CRUD ===
router.get("/", getAllDrivers);
router.get("/archived", getAllArchivedDrivers);
router.get("/search", searchDrivers);
router.post("/", createDriver);
router.patch("/:license_number", updateDriver);
router.patch("/archive/:license_number", archiveDriver);
router.patch("/unarchive/:license_number", unarchiveDriver);
router.delete("/:license_number", deleteDriver);

// == REPORT ==
router.get("/reports/license-type", getDriversByLicenseType);
router.get("/reports/status", getDriversByStatus);
router.get("/reports/age-range", getDriversByAgeRange);
router.get("/reports/sex", getDriversBySex);
router.get("/reports/bad-status", getDriversWithBadStatus);

export default router;
