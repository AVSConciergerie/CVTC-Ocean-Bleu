import { ethers } from 'ethers';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const BNB_RPC_URL = process.env.BNB_RPC_URL;
const OPERATOR_PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY;
const CVTC_ONBOARDING_CONTRACT_ADDRESS = process.env.CVTC_ONBOARDING_CONTRACT_ADDRESS;

const usersFile = './data/users.json';

const contractABI = [
    "function updateWhitelist(address user, bool status) external",
    "function buy(uint256 minCvtcOut) external payable",
    "function getReserves() external view returns (uint256, uint256)",
    "function cvtcToken() external view returns (address)"
];

const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);
const onboardingContract = new ethers.Contract(CVTC_ONBOARDING_CONTRACT_ADDRESS, contractABI, operatorWallet);

function loadUsers() {
    if (!fs.existsSync(usersFile)) return [];
    return JSON.parse(fs.readFileSync(usersFile));
}

function saveUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

async function startUserOnboarding(userAddress) {
    console.log(`🚀 Démarrage de l\'onboarding réel pour : ${userAddress}`);

    try {
        // Whitelisting réelle sur le contrat
        console.log(`📝 Whitelisting de l\'utilisateur ${userAddress}...`);
        const tx = await onboardingContract.updateWhitelist(userAddress, true);
        await tx.wait();
        console.log(`✅ Utilisateur whitelisted. Hash: ${tx.hash}`);

        const users = loadUsers();
        const existingUser = users.find(u => u.address === userAddress);
        if (!existingUser) {
            users.push({
                address: userAddress,
                onboardingStartDate: new Date().toISOString(),
                isActive: true,
                whitelisted: true,
                firstSwapCompleted: false
            });
        } else {
            existingUser.onboardingStartDate = new Date().toISOString();
            existingUser.isActive = true;
            existingUser.whitelisted = true;
        }
        saveUsers(users);

        // Premier swap réel - ACTIVÉ avec liquidité disponible
        console.log(`🔄 Exécution du premier swap réel pour ${userAddress}...`);

        try {
            // Vérifier les réserves avant le swap
            const [bnbReserve, cvtcReserve] = await onboardingContract.getReserves();
            console.log(`💰 Réserves actuelles: ${ethers.formatEther(bnbReserve)} BNB, ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);

            if (bnbReserve > 0 && cvtcReserve > 0) {
                // Calculer le montant de CVTC à recevoir pour 0.00002 BNB (montant correct)
                const bnbAmount = ethers.parseEther("0.00002");
                const minCvtcOut = 10; // Minimum 0.1 CVTC (avec 2 décimales)

                console.log(`💸 Swap: ${ethers.formatEther(bnbAmount)} BNB → minimum ${minCvtcOut / 100} CVTC`);

                // Exécuter le premier swap
                const swapTx = await onboardingContract.buy(minCvtcOut, {
                    value: bnbAmount,
                    gasLimit: 300000
                });
                await swapTx.wait();

                console.log(`✅ Premier swap réussi! Hash: ${swapTx.hash}`);

                // Calculer approximativement les CVTC reçus (basé sur AMM)
                const amountInWithFee = bnbAmount * BigInt(997); // 0.3% fee
                const numerator = amountInWithFee * cvtcReserve;
                const denominator = bnbReserve * BigInt(1000) + amountInWithFee;
                const cvtcReceived = numerator / denominator;

                const cvtcReceivedFormatted = Number(ethers.formatUnits(cvtcReceived, 2));

                // Mettre à jour les données utilisateur
                const userIndex = users.findIndex(u => u.address === userAddress);
                if (userIndex !== -1) {
                    users[userIndex].firstSwapCompleted = true;
                    users[userIndex].cvtcReceived = cvtcReceivedFormatted;
                    users[userIndex].readyForSwaps = true;
                    users[userIndex].firstSwapDate = new Date().toISOString();
                    saveUsers(users);
                }

                console.log(`🎉 Premier swap complété: ${cvtcReceivedFormatted} CVTC reçus`);

            } else {
                console.log(`⚠️ Pas de liquidité disponible pour le swap`);
                // Marquer comme prêt mais pas encore fait
                const userIndex = users.findIndex(u => u.address === userAddress);
                if (userIndex !== -1) {
                    users[userIndex].firstSwapCompleted = false;
                    users[userIndex].cvtcReceived = 0;
                    users[userIndex].readyForSwaps = false;
                    saveUsers(users);
                }
            }

        } catch (swapError) {
            console.error(`❌ Erreur lors du premier swap:`, swapError.message);

            // En cas d'erreur, marquer comme prêt mais pas fait
            const userIndex = users.findIndex(u => u.address === userAddress);
            if (userIndex !== -1) {
                users[userIndex].firstSwapCompleted = false;
                users[userIndex].cvtcReceived = 0;
                users[userIndex].readyForSwaps = true; // Toujours prêt pour réessayer
                saveUsers(users);
            }
        }

        console.log(`🎉 Onboarding complété pour ${userAddress}`);

    } catch (error) {
        console.error(`❌ Erreur lors de l'onboarding:`, error.message);
        throw error;
    }
}

async function runDailySwaps() {
    console.log('[SIMULATION] Démarrage du batch de swaps quotidiens...');
    const users = loadUsers();
    const activeUsers = users.filter(u => u.isActive);

    for (const user of activeUsers) {
        // Vérifier si l\'onboarding de 30 jours est terminé
        const startDate = new Date(user.onboardingStartDate);
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (new Date() - startDate > thirtyDays) {
            console.log(`[SIMULATION] L\'onboarding de 30 jours est terminé pour ${user.address}. Désactivation.`);
            user.isActive = false;
            continue;
        }

        try {
            console.log(`[SIMULATION] Exécution du swap quotidien pour ${user.address}...`);
            console.log(`[SIMULATION] 0.00002 BNB swappé contre ~0.028 CVTC tokens`);

            // Simuler l'accumulation de CVTC
            user.cvtcReceived = (user.cvtcReceived || 0) + 0.028;
            user.lastDailySwap = new Date().toISOString();

        } catch (error) {
            console.error(`Erreur lors du swap pour ${user.address}:`, error.message);
        }
    }
    saveUsers(users); // Sauvegarder les changements
    console.log('[SIMULATION] Batch de swaps quotidiens terminé.');
}

export {
    startUserOnboarding,
    runDailySwaps
};