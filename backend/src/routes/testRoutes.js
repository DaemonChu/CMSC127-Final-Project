// DEBUG: frontend + backend integration
import express from "express";

const testRouter = express.Router();

testRouter.get("/", (req, res) => {
  res.json({ message: "Backend is working!!!" });
});

export default testRouter;