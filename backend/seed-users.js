// backend/seed-users.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedFilePath = path.resolve(__dirname, "users.seed.json");
const usersFilePath = path.resolve(__dirname, "users.json");

try {
  const seedData = fs.readFileSync(seedFilePath, "utf-8");
  fs.writeFileSync(usersFilePath, seedData);
  console.log("✅ Fichier users.json peuplé avec les données de seed.");
} catch (err) {
  console.error("❌ Erreur lors du seeding :", err);
}
