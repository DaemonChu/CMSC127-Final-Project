import express from "express";
import { runMaintenanceManually } from "../controllers/maintenanceController.js";

const router = express.Router();

router.post("/run", runMaintenanceManually);

export default router;
