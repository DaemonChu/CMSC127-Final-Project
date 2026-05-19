// src/routes/trafficViolationRoutes.js
import express from "express";

import {
  // CRUD
  getAllViolations,
  getAllArchivedViolations,
  searchViolations,
  createViolation,
  updateViolation,
  archiveViolation,
  unarchiveViolation,
  deleteViolation,

  // REPORTS
  getViolationTotalsByType,
  getViolationsByDriver,
  getViolationsByLocation,
} from "../controllers/trafficViolationController.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────
//  IMPORTANT: static/specific paths MUST come before parametric
//  ones (/:violation_ticket_id) or Express will swallow them.
// ─────────────────────────────────────────────────────────────

// === Static GET routes ===
router.get("/",         getAllViolations);
router.get("/archived", getAllArchivedViolations);
router.get("/search",   searchViolations);

// === Report routes (all static paths — before any /:param) ===
// Paths match Reports.jsx REPORT_CONFIGS buildUrl() exactly
router.get("/reports/by-driver",       getViolationsByDriver);    // ?license_number=&from=&to=
router.get("/reports/by-type",         getViolationTotalsByType); // ?year=
router.get("/reports/vehicles-by-city", getViolationsByLocation); // ?city=

// === Static PATCH routes (archive/unarchive before /:id) ===
router.post("/", createViolation);
router.patch("/archive/:violation_ticket_id",   archiveViolation);
router.patch("/unarchive/:violation_ticket_id", unarchiveViolation);

// === Parametric routes last ===
router.patch("/:violation_ticket_id",  updateViolation);
router.delete("/:violation_ticket_id", deleteViolation);

export default router;