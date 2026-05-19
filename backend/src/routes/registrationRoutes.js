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

// === CRUD ===
router.get("/search", searchRegistrations);
router.get("/", getAllRegistrations);
router.post("/renew", renewRegistration);
router.post("/", createRegistration);
router.patch("/:registration_number", updateRegistration);
router.delete("/:registration_number", deleteRegistration);

// === SEARCH + REGISTRATION REPORTS ===
router.get("/search", searchRegistrations);

export default router;
