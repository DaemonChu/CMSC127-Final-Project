import express from "express";
import dotenv from "dotenv";

//import testRouter from "./routes/testRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

// === ROUTES ===
app.use("/api/drivers", driverRoutes);

/* 
// ============================================================
// NOTE: for frontend + backend integration testing only
// ============================================================

app.use("/api/test", testRouter);

*/

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
