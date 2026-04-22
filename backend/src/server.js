import express from "express";
import dotenv from "dotenv";

import testRouter from "./routes/testRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// DEBUG: frontend + backend integration
app.use("/api/test", testRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});