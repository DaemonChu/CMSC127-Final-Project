import express from "express";
import dotenv from "dotenv";

// cron maintenance
import "./jobs/maintenanceCron.js";

// import testRouter from "./routes/testRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";

// optional manual maintenance all (if needed)
import maintenanceRoutes from "./routes/maintenanceRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

// === ROUTES ===
app.use("/api/drivers", driverRoutes);
app.use("/api/vehicles/", vehicleRoutes);
app.use("/api/maintenance", maintenanceRoutes);

/* 
// ============================================================
// NOTE: for frontend + backend integration testing only
// ============================================================

app.use("/api/test", testRouter);

*/

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // run startup maintenance
  const { runMaintenance } = await import("./service/maintenanceService.js");
  await runMaintenance();
  console.log("Startup maintenance completed");
});
