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
  // REPORTS
  getDriversByLicenseType,
  getDriversByStatus,
  getDriversByAgeRange,
  getDriversBySex,
  getDriversWithBadStatus,
} from "../controllers/driverController.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────
//  IMPORTANT: static/specific paths MUST come before parametric
//  ones (/:license_number) or Express will swallow them.
// ─────────────────────────────────────────────────────────────

// === SEARCH (static — before /:license_number) ===
router.get("/search", searchDrivers);

// === REPORT ROUTES (static — before /:license_number) ===
router.get("/reports/license-type", getDriversByLicenseType); // ?type=
router.get("/reports/status",       getDriversByStatus);      // ?status=
router.get("/reports/age-range",    getDriversByAgeRange);    // ?min=&max=
router.get("/reports/sex",          getDriversBySex);         // ?sex=
router.get("/reports/bad-status",   getDriversWithBadStatus); // no params

// === CRUD ===
router.get("/",          getAllDrivers);
router.get("/archived",  getAllArchivedDrivers);
router.post("/",         createDriver);
router.patch("/renew/:license_number",     renewDriver);
router.patch("/archive/:license_number",   archiveDriver);
router.patch("/unarchive/:license_number", unarchiveDriver);
router.patch("/:license_number",           updateDriver);
router.delete("/:license_number",          deleteDriver);

export default router;