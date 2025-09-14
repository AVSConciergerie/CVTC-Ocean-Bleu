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
    "function getUserOnboardingStatus(address user) external view returns (bool,bool,uint256,uint256,uint8,uint256)",
    "function setAuthorizedOperator(address operator, bool status) external"
];

// Chemin vers le fichier des utilisateurs
const USERS_FILE_PATH = path.resolve(process.cwd(), 'data/users.json');

// Initialiser le provider et le wallet
const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);
const onboardingContract = new ethers.Contract(ONBOARDING_CONTRACT_ADDRESS, onboardingABI, operatorWallet);

/**
 * Calcule le nombre de swaps manqués pour un utilisateur
 */
function calculateMissedSwaps(user) {
    const now = new Date();
    const lastSwap = new Date(user.lastDailySwap || user.onboardingStartDate);
    const daysSinceLastSwap = Math.floor((now - lastSwap) / (1000 * 60 * 60 * 24));

    // Maximum 3 jours de rattrapage pour éviter les abus
    return Math.min(Math.max(0, daysSinceLastSwap - 1), 3);
}

/**
 * Exécute les swaps de rattrapage pour un utilisateur
 */
async function catchUpUserSwaps(user, missedDays) {
    console.log(`🔄 Rattrapage de ${missedDays} swaps pour ${user.address}...`);

    for (let i = 0; i < missedDays; i++) {
        try {
            console.log(`   Jour ${i + 1}/${missedDays}...`);

            // Vérifier le statut avant le swap
            const statusBefore = await onboardingContract.getUserOnboardingStatus(user.address);
            const [isActive, completed] = statusBefore;

            if (!isActive || completed) {
                console.log(`   ⚠️ Utilisateur inactif ou onboarding terminé`);
                break;
            }

            // Exécuter le swap
            const tx = await onboardingContract.executeDailySwap(user.address);
            await tx.wait();

            console.log(`   ✅ Swap ${i + 1} réussi - Hash: ${tx.hash}`);

            // Petite pause pour éviter la surcharge
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.error(`   ❌ Erreur lors du swap ${i + 1}:`, error.message);

            // Si c'est une erreur de timing, on peut essayer de continuer
            if (error.message.includes("Too early")) {
                console.log(`   ⏰ Swap trop tôt, passage au suivant...`);
                continue;
            }

            // Pour les autres erreurs, arrêter pour cet utilisateur
            break;
        }
    }
}

/**
 * Fonction principale pour rattraper tous les swaps manqués
 */
async function catchUpAllMissedSwaps() {
    console.log('🔧 RATTRAPAGE DES SWAPS MANQUÉS');
    console.log('===============================');

    try {
        // Lire le fichier des utilisateurs
        const data = await fs.readFile(USERS_FILE_PATH, 'utf8');
        const users = JSON.parse(data);
        const activeUsers = users.filter(u => u.isActive);

        if (activeUsers.length === 0) {
            console.log('ℹ️ Aucun utilisateur actif trouvé.');
            return;
        }

        console.log(`👥 ${activeUsers.length} utilisateurs actifs trouvés`);
        console.log(`👤 Opérateur: ${operatorWallet.address}`);
        console.log(`📍 Contrat: ${ONBOARDING_CONTRACT_ADDRESS}`);
        console.log('');

        let totalMissedSwaps = 0;
        let totalCaughtUp = 0;

        for (const user of activeUsers) {
            const missedDays = calculateMissedSwaps(user);

            if (missedDays > 0) {
                console.log(`🔍 ${user.address}: ${missedDays} jours manqués`);
                totalMissedSwaps += missedDays;

                await catchUpUserSwaps(user, missedDays);
                totalCaughtUp += missedDays;

                // Mettre à jour la date du dernier swap
                user.lastDailySwap = new Date().toISOString();

                console.log('');
            } else {
                console.log(`✅ ${user.address}: à jour`);
            }
        }

        // Sauvegarder les changements
        await fs.writeFile(USERS_FILE_PATH, JSON.stringify(users, null, 2));

        console.log('📊 RÉSULTATS DU RATTRAPAGE:');
        console.log('==========================');
        console.log(`🔢 Swaps manqués détectés: ${totalMissedSwaps}`);
        console.log(`✅ Swaps rattrapés: ${totalCaughtUp}`);
        console.log(`💰 Économie estimée: ${(totalCaughtUp * 0.01).toFixed(4)} BNB`);

        if (totalCaughtUp > 0) {
            console.log('\n🎉 Rattrapage terminé avec succès!');
        } else {
            console.log('\nℹ️ Aucun swap à rattraper.');
        }

    } catch (error) {
        console.error('❌ Erreur lors du rattrapage:', error);
    }
}

// Exécuter le rattrapage
catchUpAllMissedSwaps().catch(console.error);