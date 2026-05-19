import mysql from "mysql2/promise";
import { getRootConfig, DB_NAME, confirmAction } from "./db.js";

export async function resetDB() {
  // Ask for confirmation first
  const confirmed = confirmAction(`This will DELETE the database "${DB_NAME}"`);

  if (!confirmed) {
    console.log("Reset cancelled.");
    return;
  }

  const connection = await mysql.createConnection(getRootConfig());

  console.log("Resetting DB...");

  await connection.query(`DROP DATABASE IF EXISTS ${DB_NAME};`);

  await connection.end();

  console.log("Reset complete ✓");
}
