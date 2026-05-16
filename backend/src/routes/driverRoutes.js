import express from "express";
import {
  getAllDrivers,
  createDriver,
  updateDriver,
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
router.get("/search", searchDrivers);
router.post("/", createDriver);
router.patch("/:license_number", updateDriver);
router.delete("/:license_number", deleteDriver);

// == REPORT ==
router.get("/reports/license-type", getDriversByLicenseType);
router.get("/reports/status", getDriversByStatus);
router.get("/reports/age-range", getDriversByAgeRange);
router.get("/reports/sex", getDriversBySex);
router.get("/reports/bad-status", getDriversWithBadStatus);

export default router;
