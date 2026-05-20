import { initDB } from "./init.js";
import { seedDB } from "./seed.js";

export async function setupDB() {
  console.log("\nRunning FULL database setup...\n");

  await initDB();
  await seedDB();

  console.log("\nDatabase setup complete ✓");
}
