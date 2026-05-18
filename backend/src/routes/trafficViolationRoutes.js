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
  getViolationsByLocation,
} from "../controllers/trafficViolationController.js";

const router = express.Router();

// === CRUD ===
router.get("/", getAllViolations);
router.get("/archived", getAllArchivedViolations);
router.post("/", createViolation);
router.patch("/:violation_ticket_id", updateViolation);
router.patch("/archive/:violation_ticket_id", archiveViolation);
router.patch("/unarchive/:violation_ticket_id", unarchiveViolation);
router.delete("/:violation_ticket_id", deleteViolation);

// === REPORTS ===
router.get("/search", searchViolations); // +violations commited by a given driver
router.get("/reports/types/:year", getViolationTotalsByType);
router.get("/reports/vehicles/location", getViolationsByLocation);

export default router;
