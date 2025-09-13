import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from 'cors';
import cron from 'node-cron';
import { startScheduler } from '../services/onboardingScheduler.js'; // Ajout .js
import { getReimbursementService } from '../services/reimbursementService.js'; // Service de remboursement

import fs from 'fs'; // Import de fs pour les opérations de fichiers

const app = express();
const PORT = process.env.PORT || 4000;

// --- Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// --- Routes
import onboardingRoutes from '../routes/onboarding.js'; // Ajout .js
import paymasterRoutes from '../routes/paymaster.js'; // Route paymaster fallback
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/paymaster', paymasterRoutes);

// --- Auth Middleware
function requireAdminAuth(req, res, next) {
  const token = req.cookies.admin_token;
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  next();
}

// --- Login Route
app.post("/api/admin/login", async (req, res) => {
  const { password } = req.body;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminPasswordHash || !(await bcrypt.compare(password, adminPasswordHash))) {
    return res.status(401).json({ error: "Invalid password" });
  }

  res.cookie("admin_token", process.env.ADMIN_TOKEN, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return res.json({ message: "Login successful" });
});

// Vérifie si un mot de passe admin est déjà défini
app.get("/api/admin/needs-password", (req, res) => {
  if (!process.env.ADMIN_PASSWORD_HASH) {
    return res.json({ needsPassword: true });
  }
  res.json({ needsPassword: false });
});

// --- Change Admin Password
app.post("/api/admin/change-password", requireAdminAuth, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "New password is too short" });
  }
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  // In a real application, you would update process.env.ADMIN_PASSWORD_HASH
  // or store this hashed password in a secure database.
  // For this example, we'll just acknowledge it.
  res.json({ message: "Password updated (conceptually)" });
});

// --- Whitelist Management (simple file storage)
const whitelistFile = "./whitelist.json";

function loadWhitelist() {
  if (!fs.existsSync(whitelistFile)) return [];
  return JSON.parse(fs.readFileSync(whitelistFile));
}

function saveWhitelist(list) {
  fs.writeFileSync(whitelistFile, JSON.stringify(list, null, 2));
}

app.post("/api/admin/whitelist/add", requireAdminAuth, (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: "Address required" });

  const list = loadWhitelist();
  if (!list.includes(address)) {
    list.push(address);
    saveWhitelist(list);
  }
  res.json({ message: "Address whitelisted", list });
});

app.get("/api/admin/whitelist", requireAdminAuth, (req, res) => {
  res.json({ whitelist: loadWhitelist() });
});

// --- Trigger Manual Swaps (for testing)
// La fonction runDailySwaps n'est pas définie ici, donc commentée pour éviter une erreur
app.post("/api/admin/trigger-swaps", requireAdminAuth, async (req, res) => {
  console.log("Déclenchement manuel des swaps par l'administrateur.");
  try {
    // await runDailySwaps(); 
    res.status(200).json({ message: "Le batch de swaps a été exécuté avec succès (simulé)." });
  } catch (error) {
    console.error("Erreur lors du déclenchement manuel des swaps:", error);
    res.status(500).json({ message: "Une erreur est survenue lors de l\'exécution des swaps." });
  }
});

// --- Logout Admin

app.post("/api/admin/logout", requireAdminAuth, (req, res) => {
  res.clearCookie("admin_token", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  res.json({ message: "Logout successful" });
});

// --- Start Daily Swap Scheduler
startScheduler();

// --- Start Reimbursement Service
const reimbursementService = getReimbursementService();
reimbursementService.start();

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('🛑 Arrêt du serveur...');
  reimbursementService.cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Arrêt du serveur...');
  reimbursementService.cleanup();
  process.exit(0);
});

// --- Start Server
app.listen(PORT, () => {
  console.log(`Admin API running on http://localhost:${PORT}`);
  console.log(`🔄 Service de remboursement automatique: ${reimbursementService.isRunning ? 'ACTIF' : 'INACTIF'}`);
});