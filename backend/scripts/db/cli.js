// MAIN MENU CLI
import promptSync from "prompt-sync";
import { initDB } from "./init.js";
import { resetDB } from "./reset.js";
import { seedDB } from "./seed.js";
import { setupDB } from "./setup.js";

const prompt = promptSync({ sigint: true });

async function menu() {
  let choice;

  do {
    console.log("\n======================");
    console.log("   LTO DB CLI MENU");
    console.log("======================");
    console.log("[0] !!QUICK SETUP!!");
    console.log("[1] Init Database");
    console.log("[2] Reset Database");
    console.log("[3] Seed Database");
    console.log("[4] Exit");

    choice = prompt("Select option: ");

    switch (choice) {
      case "0":
        await setupDB();
        return;

      case "1":
        await initDB();
        break;

      case "2":
        await resetDB();
        break;

      case "3":
        await seedDB();
        break;

      case "4":
        console.log("Goodbye");
        break;

      default:
        console.log("Invalid option. Try again.");
    }
  } while (choice !== "4");
}

menu().catch((err) => {
  console.error("CLI Error:", err.message);
  process.exit(1);
});
