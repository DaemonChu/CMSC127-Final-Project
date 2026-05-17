import { runMaintenance } from "../service/maintenanceService.js";

export const runMaintenanceManually = async (req, res) => {
  try {
    const result = await runMaintenance();

    res.json({
      message: "Manual maintenance completed",
      result,
    });
  } catch (err) {
    res.status(500).json({
      message: "Maintenance failed",
      error: err.message,
    });
  }
};
