import cron from "node-cron";
import { runMaintenance } from "../service/maintenanceService.js";

// run every midnight
cron.schedule("0 0 * * *", async () => {
  console.log("[CRON] Running nightly maintenance...");

  try {
    const result = await runMaintenance();

    console.log("[CRON] Completed:", result);
  } catch (err) {
    console.error("[CRON] Failed:", err);
  }
});
