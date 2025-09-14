import { ethers } from 'ethers';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const {
    BNB_RPC_URL,
    OPERATOR_PRIVATE_KEY
} = process.env;

// Adresse du contrat onboarding
const ONBOARDING_CONTRACT_ADDRESS = "0xf3af730B6eaF257EC44b244d56F3073Fd6B593c5";

// ABI pour les fonctions nécessaires
const onboardingABI = [
    "function executeDailySwap(address user) external",
    "function getUserOnboardingStatus(address user) external view returns (bool,bool,uint256,uint256,uint8,uint256)"
];

// Chemin vers le fichier des utilisateurs
const USERS_FILE_PATH = path.resolve(process.cwd(), 'data/users.json');

// Initialiser le provider et le wallet
const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);
const onboardingContract = new ethers.Contract(ONBOARDING_CONTRACT_ADDRESS, onboardingABI, operatorWallet);

/**
 * Rattrape manuellement les swaps pour un utilisateur spécifique
 */
async function catchUpSpecificUser(userAddress, daysToCatchUp = 3) {
    console.log(`🎯 RATTRAPAGE MANUEL pour ${userAddress}`);
    console.log(`📅 Jours à rattraper: ${daysToCatchUp}`);
    console.log('=====================================');

    try {
        // Lire le fichier des utilisateurs
        const data = await fs.readFile(USERS_FILE_PATH, 'utf8');
        const users = JSON.parse(data);
        const user = users.find(u => u.address.toLowerCase() === userAddress.toLowerCase());

        if (!user) {
            console.log('❌ Utilisateur non trouvé dans users.json');
            return;
        }

        if (!user.isActive) {
            console.log('⚠️ Utilisateur inactif');
            return;
        }

        console.log(`👤 Utilisateur: ${user.address}`);
        console.log(`📊 CVTC actuel: ${user.cvtcReceived || 0}`);
        console.log('');

        let successfulSwaps = 0;

        for (let i = 0; i < daysToCatchUp; i++) {
            try {
                console.log(`🔄 Swap ${i + 1}/${daysToCatchUp}...`);

                // Vérifier le statut avant le swap
                const status = await onboardingContract.getUserOnboardingStatus(user.address);
                const [isActive, completed, daysRemaining, cvtcAccumulated] = status;

                if (!isActive || completed) {
                    console.log(`   ⚠️ Utilisateur inactif ou onboarding terminé`);
                    break;
                }

                // Exécuter le swap
                const tx = await onboardingContract.executeDailySwap(user.address);
                await tx.wait();

                successfulSwaps++;
                console.log(`   ✅ Swap ${i + 1} réussi - Hash: ${tx.hash}`);

                // Petite pause
                await new Promise(resolve => setTimeout(resolve, 3000));

            } catch (error) {
                console.error(`   ❌ Erreur swap ${i + 1}:`, error.message);

                if (error.message.includes("Too early")) {
                    console.log(`   ⏰ Attente nécessaire entre les swaps`);
                    // Attendre un peu plus longtemps
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    i--; // Réessayer le même swap
                    continue;
                }

                // Pour les autres erreurs, continuer avec le suivant
                console.log(`   ⏭️ Passage au swap suivant...`);
            }
        }

        // Mettre à jour les données utilisateur
        if (successfulSwaps > 0) {
            user.lastDailySwap = new Date().toISOString();
            await fs.writeFile(USERS_FILE_PATH, JSON.stringify(users, null, 2));
        }

        console.log('');
        console.log('📊 RÉSULTATS:');
        console.log(`✅ Swaps réussis: ${successfulSwaps}/${daysToCatchUp}`);
        console.log(`💰 BNB dépensé: ${(successfulSwaps * 0.01).toFixed(4)} BNB`);

        if (successfulSwaps > 0) {
            console.log('🎉 Rattrapage terminé!');
        }

    } catch (error) {
        console.error('❌ Erreur générale:', error);
    }
}

// Configuration pour rattraper un utilisateur spécifique
const USER_TO_CATCH_UP = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b"; // Remplacer par l'adresse réelle
const DAYS_TO_CATCH_UP = 3;

// Exécuter le rattrapage
catchUpSpecificUser(USER_TO_CATCH_UP, DAYS_TO_CATCH_UP).catch(console.error);