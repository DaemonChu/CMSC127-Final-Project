import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// === CONNECTION POOL ===
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    // additional settings
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// === TEST CONNECTION ===
try {
    const connection = await db.getConnection();
    console.log("Connected to MariaDB!");
    connection.release();
} catch (err) {
    console.log("Connection Failed!");
    console.log(err);
}

export default db;