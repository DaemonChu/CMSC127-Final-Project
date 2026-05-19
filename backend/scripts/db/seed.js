import mysql from "mysql2/promise";
import fs from "fs";
import { getAppConfig } from "./db.js";

export async function seedDB() {
  const connection = await mysql.createConnection(getAppConfig());

  console.log("Seeding DB...");

  const sql = fs.readFileSync("./database/LTO_seed.sql", "utf-8");

  await connection.query(sql);

  await connection.end();

  console.log("Seed complete ✓");
}
