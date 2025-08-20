import express from 'express';
import { userRepository } from '../repositories/userRepository.js';
import { createWallet } from '../services/privy.js';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const {
    BNB_RPC_URL,
    OPERATOR_PRIVATE_KEY,
    CVTC_ONBOARDING_CONTRACT_ADDRESS
} = process.env;

// ABI minimal pour interagir avec le contrat CVTCOnboarding
const onboardingABI = [
    "function setWhitelisted(address user, bool status) external"
];

// Initialiser le provider et le wallet de l'opérateur
const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);

// Initialiser l'instance du contrat
const onboardingContract = new ethers.Contract(CVTC_ONBOARDING_CONTRACT_ADDRESS, onboardingABI, operatorWallet);

const router = express.Router();

// GET users (avec filtre par statut)
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const userRepo = userRepository(req.app.locals.db);
        let users;

        if (status) {
            users = await userRepo.getUsersByStatus(status);
        } else {
            users = await userRepo.getAllUsers();
        }
        
        res.json(users);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PATCH approve a user (greylist -> whitelist)
router.patch('/:userId/approve', async (req, res) => {
    try {
        const { userId } = req.params;
        const { adminWalletAddress, ...updatedUserData } = req.body;

        if (!adminWalletAddress) {
            return res.status(400).json({ error: 'L\'adresse du portefeuille administrateur est requise.' });
        }

        const userRepo = userRepository(req.app.locals.db);
        const userToApprove = await userRepo.findUserById(userId);

        if (!userToApprove) {
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }

        if (userToApprove.status !== 'greylist') {
            return res.status(400).json({ error: `L\'utilisateur n\'est pas sur la greylist (statut actuel: ${userToApprove.status})` });
        }

        // 1. Mettre à jour les données de l'utilisateur avec les infos fournies par l'admin
        //    et assigner le portefeuille de l'admin comme parrain.
        const dataToUpdate = {
            ...updatedUserData,
            recommender_wallet_address: adminWalletAddress
        };
        await userRepo.updateUser(userId, dataToUpdate);

        // 2. Appeler le smart contract pour whitelister l'adresse
        try {
            console.log(`Ajout de l\'adresse ${userToApprove.wallet_address} à la whitelist du contrat via approbation admin...`);
            const tx = await onboardingContract.setWhitelisted(userToApprove.wallet_address, true, {
                gasLimit: 100000
            });
            await tx.wait();
            console.log(`Adresse ${userToApprove.wallet_address} ajoutée avec succès à la whitelist. Hash: ${tx.hash}`);
        } catch (contractError) {
            console.error(`Erreur lors de l\'ajout à la whitelist du contrat pour ${userToApprove.wallet_address}:`, contractError.reason || contractError.message);
            // En cas d'échec, on ne change pas le statut et on retourne une erreur
            return res.status(500).json({ error: 'Erreur Smart Contract', details: contractError.reason || contractError.message });
        }

        // 3. Mettre à jour le statut de l'utilisateur à 'whitelist'
        await userRepo.updateUser(userId, { status: 'whitelist' });

        const finalUser = await userRepo.findUserById(userId);
        res.status(200).json(finalUser);

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});


// POST create new user + wallet
router.post('/', async (req, res) => {
    try {
        const { email, parrain } = req.body;
        if (!email) return res.status(400).json({ error: 'Email requis' });

        const userRepo = userRepository(req.app.locals.db);

        const existingUser = await userRepo.findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: 'Utilisateur déjà existant' });
        }

        // Créer wallet via Privy (stub)
        const wallet = await createWallet(email);

        // --- LOGIQUE WHITELIST / GREYLIST ---
        const isWhitelisted = parrain && parrain.length > 0;
        let userStatus = isWhitelisted ? 'whitelist' : 'greylist';

        if (userStatus === 'whitelist') {
            try {
                console.log(`Ajout de l'adresse ${wallet.address} à la whitelist du contrat d'onboarding...`);
                const tx = await onboardingContract.setWhitelisted(wallet.address, true, {
                    gasLimit: 100000
                });
                await tx.wait();
                console.log(`Adresse ${wallet.address} ajoutée avec succès à la whitelist. Hash: ${tx.hash}`);
            } catch (contractError) {
                console.error(`Erreur lors de l'ajout à la whitelist du contrat pour ${wallet.address}:`, contractError.reason || contractError.message);
                userStatus = 'greylist';
                console.log(`L'utilisateur ${wallet.address} est passé en greylist suite à l'échec de l'ajout au contrat.`);
            }
        }
        // --- FIN LOGIQUE WHITELIST / GREYLIST ---

        const newUser = await userRepo.createUser({
            email,
            wallet_address: wallet.address, // Assuming wallet is an object with an object with an address property
            status: userStatus,
            recommender_wallet_address: parrain
        });

        res.status(201).json({ ...newUser, access: userStatus });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
