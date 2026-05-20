import express from "express";
import {
  getAllRegistrations,
  searchRegistrations,
  createRegistration,
  updateRegistration,
  deleteRegistration,
  renewRegistration,
} from "../controllers/registrationController.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────
//  IMPORTANT: static/specific paths MUST come before parametric
//  ones (/:registration_number) or Express will swallow them.
// ─────────────────────────────────────────────────────────────

// === SEARCH (static — before /:registration_number) ===
router.get("/search", searchRegistrations);

// === REPORT ROUTES ===
// "Expired Registrations as of a given date"
// Reuses searchRegistrations with expired=true&date=YYYY-MM-DD
router.get("/reports/expired", (req, res, next) => {
  // Map ?as_of= → the expired + date filters that searchRegistrations expects
  req.query.expired = "true";
  req.query.date    = req.query.as_of;
  next();
}, searchRegistrations); // ?as_of=YYYY-MM-DD

// === CRUD ===
router.get("/",                            getAllRegistrations);
router.post("/renew",                      renewRegistration);
router.post("/",                           createRegistration);
router.patch("/:registration_number",      updateRegistration);
router.delete("/:registration_number",     deleteRegistration);

export default router;