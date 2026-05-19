import dotenv from "dotenv";
import promptSync from "prompt-sync";

dotenv.config();

export const DB_HOST = process.env.DB_HOST;
export const DB_NAME = process.env.DB_NAME;
export const DB_USER = process.env.DB_USER;
export const DB_PASS = process.env.DB_PASSWORD;

const prompt = promptSync({ sigint: true });

// ROOT (admin access)
export function getRootConfig() {
  const rootPassword = prompt("Enter MySQL root password: ", {
    echo: "*",
  });

  return {
    host: DB_HOST,
    user: "root",
    password: rootPassword,
    multipleStatements: true,
  };
}

// APP user (backend access)
export function getAppConfig() {
  return {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    multipleStatements: true,
  };
}

// safer helper
export function confirmAction(message) {
  const answer = prompt(`${message} (y/n): `);
  return answer.toLowerCase() === "y";
}
