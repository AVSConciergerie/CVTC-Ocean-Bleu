import dotenv from 'dotenv';
import express from 'express';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from 'cors';
import cron from 'node-cron';
import { startScheduler } from './services/onboardingScheduler.js';
import setupDatabase from './database.js';
import { userRepository } from './repositories/userRepository.js';
import onboardingRoutes from './routes/users.js';
import moneriumRoutes from './routes/monerium.js';
import paymasterRoutes from './routes/paymaster.js';
import multer from 'multer';

dotenv.config();

async function startServer() {
    const db = await setupDatabase();

    const app = express();
    app.locals.db = db; // Make db available to routes
    const PORT = process.env.PORT || 4000;

    // --- Middleware
    app.use(cors({ origin: true, credentials: true }));
    app.use(bodyParser.json());
    app.use(cookieParser());

    // --- Routes
    app.use('/api/onboarding', onboardingRoutes);
    app.use('/api/monerium', moneriumRoutes);
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
        secure: false,
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
      res.json({ message: "Password updated (conceptually)" });
    });

    // --- Whitelist Management (Database) ---
    app.post("/api/admin/whitelist/add", requireAdminAuth, async (req, res) => {
        try {
            const { address } = req.body;
            if (!address) return res.status(400).json({ error: "Address required" });

            const userRepo = userRepository(req.app.locals.db);
            const existingUser = await userRepo.findUserByWalletAddress(address);

            if (existingUser) {
                await userRepo.updateUserStatus(address, 'whitelist');
            } else {
                await userRepo.createUser({
                    email: null, // Or a placeholder
                    wallet_address: address,
                    status: 'whitelist',
                    recommender_wallet_address: 'admin' // Or null
                });
            }
            
            const whitelist = await userRepo.getUsersByStatus('whitelist');
            res.json({ message: "Address whitelisted", whitelist });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    });

    app.get("/api/admin/whitelist", requireAdminAuth, async (req, res) => {
        try {
            const userRepo = userRepository(req.app.locals.db);
            const whitelist = await userRepo.getUsersByStatus('whitelist');
            res.json({ whitelist });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    });

    // --- Multer setup for CSV upload ---
    const storage = multer.memoryStorage();
    const upload = multer({ storage: storage });

    app.post("/api/admin/whitelist/upload-csv", requireAdminAuth, upload.single('csvfile'), async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        try {
            const userRepo = userRepository(req.app.locals.db);
            const csvBuffer = req.file.buffer.toString('utf-8');
            const addresses = csvBuffer.split('\n').map(line => line.trim()).filter(line => line);

            for (const address of addresses) {
                const existingUser = await userRepo.findUserByWalletAddress(address);
                if (existingUser) {
                    await userRepo.updateUserStatus(address, 'whitelist');
                } else {
                    await userRepo.createUser({
                        email: null,
                        wallet_address: address,
                        status: 'whitelist',
                        recommender_wallet_address: 'admin-csv-import'
                    });
                }
            }

            const whitelist = await userRepo.getUsersByStatus('whitelist');
            res.json({ message: `${addresses.length} addresses processed.`, whitelist });

        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Erreur serveur lors du traitement du CSV.' });
        }
    });

    // --- Trigger Manual Swaps (for testing)
    app.post("/api/admin/trigger-swaps", requireAdminAuth, async (req, res) => {
      console.log("Déclenchement manuel des swaps par l'administrateur.");
      try {
        // await runDailySwaps();
        res.status(200).json({ message: "Le batch de swaps a été exécuté avec succès (simulé)." });
      } catch (error) {
        console.error("Erreur lors du déclenchement manuel des swaps:", error);
        res.status(500).json({ message: "Une erreur est survenue lors de l'exécution des swaps." });
      }
    });

    // --- Logout Admin
    app.post("/api/admin/logout", requireAdminAuth, (req, res) => {
      res.clearCookie("admin_token", {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
      });
      res.json({ message: "Logout successful" });
    });

    // --- Start Daily Swap Scheduler
    // startScheduler();

    // --- Start Server
    app.listen(PORT, () => {
      console.log(`Admin API running on http://localhost:${PORT}`);
    });
}

startServer();