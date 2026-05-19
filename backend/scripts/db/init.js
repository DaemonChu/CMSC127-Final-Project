import mysql from "mysql2/promise";
import fs from "fs";
import { getRootConfig, DB_NAME } from "./db.js";

export async function initDB() {
  const connection = await mysql.createConnection(getRootConfig());

  console.log("Initializing DB...");

  const sql = fs.readFileSync("./database/LTO_init.sql", "utf-8");

  await connection.query(sql);

  await connection.end();

  console.log("Init complete ✓");
}
