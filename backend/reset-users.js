// backend/reset-users.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFilePath = path.resolve(__dirname, "users.json");

const args = process.argv.slice(2);

// Charger les utilisateurs actuels, ou initialiser un objet vide si le fichier n'existe pas
let users = {};
try {
  const data = fs.readFileSync(usersFilePath, "utf-8");
  users = JSON.parse(data);
} catch (err) {
  console.log("ℹ️ Fichier users.json non trouvé, sera créé.");
}

let updatedUsers = {};

if (args.includes("--greylist")) {
  updatedUsers = Object.fromEntries(
    Object.entries(users).filter(([_, user]) => user.status !== "greylist")
  );
  console.log("✅ Greylist réinitialisée.");
} else if (args.includes("--whitelist")) {
  updatedUsers = Object.fromEntries(
    Object.entries(users).filter(([_, user]) => user.status !== "whitelist")
  );
  console.log("✅ Whitelist réinitialisée.");
} else {
  // Comportement par défaut : tout réinitialiser
  updatedUsers = {};
  console.log("✅ Fichier users.json complètement réinitialisé.");
}

fs.writeFileSync(usersFilePath, JSON.stringify(updatedUsers, null, 2));
