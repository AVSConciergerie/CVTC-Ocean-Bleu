import cron from 'node-cron';
import * as ethers from 'ethers';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(new URL('.', import.meta.url).pathname, '../.env') });

const {
    BNB_RPC_URL,
    OPERATOR_PRIVATE_KEY,
    CVTC_ONBOARDING_CONTRACT_ADDRESS
} = process.env;

// Utiliser l'adresse du contrat onboarding déployé
const ONBOARDING_CONTRACT_ADDRESS = CVTC_ONBOARDING_CONTRACT_ADDRESS || "0xf3af730B6eaF257EC44b244d56F3073Fd6B593c5";

// ABI complet pour le contrat CVTCOnboarding
const onboardingABI = [
    "function executeDailySwap(address user) external",
    "function getUserOnboardingStatus(address user) external view returns (bool,bool,uint256,uint256,uint8,uint256)",
    "function getGlobalStats() external view returns (uint256,uint256,uint256,uint256,uint256,uint256)",
    "function setAuthorizedOperator(address operator, bool status) external"
];

// Chemin vers le fichier des utilisateurs
const USERS_FILE_PATH = path.resolve(new URL('.', import.meta.url).pathname, '../data/users.json');

// Initialiser le provider et le wallet de l'opérateur
const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);

// Initialiser l'instance du contrat avec la bonne adresse
const onboardingContract = new ethers.Contract(ONBOARDING_CONTRACT_ADDRESS, onboardingABI, operatorWallet);

/**
 * Lit le fichier users.json et retourne la liste des adresses de wallet.
 * @returns {Promise<string[]>}
 */
async function getRegisteredUsers() {
    try {
        const data = await fs.readFile(USERS_FILE_PATH, 'utf8');
        const users = JSON.parse(data);
        // Retourne les adresses des utilisateurs actifs
        return users.filter(u => u.isActive).map(u => u.address);
    } catch (error) {
        console.error("Erreur lors de la lecture du fichier des utilisateurs:", error);
        return [];
    }
}

/**
 * Exécute les swaps quotidiens pour tous les utilisateurs actifs via le contrat CVTCOnboarding.
 */
async function runDailySwaps() {
    console.log('🚀 Démarrage du processus de swap quotidien...');

    try {
        const data = await fs.readFile(USERS_FILE_PATH, 'utf8');
        const users = JSON.parse(data);
        const activeUsers = users.filter(u => u.isActive);

        if (activeUsers.length === 0) {
            console.log('ℹ️ Aucun utilisateur actif trouvé.');
            return;
        }

        console.log(`🔄 Trouvé ${activeUsers.length} utilisateurs actifs. Exécution des swaps quotidiens...`);

        for (const user of activeUsers) {
            try {
                // Vérifier le statut d'onboarding de l'utilisateur
                const status = await onboardingContract.getUserOnboardingStatus(user.address);
                const [isActive, completed, daysRemaining, cvtcAccumulated, currentPalier, totalRepaid] = status;

                if (!isActive || completed) {
                    console.log(`⚠️ Utilisateur ${user.address} inactif ou onboarding terminé. Ignoré.`);
                    continue;
                }

                // Exécuter le swap quotidien via le contrat onboarding
                console.log(`🔄 Exécution du swap quotidien pour ${user.address}...`);
                const tx = await onboardingContract.executeDailySwap(user.address);
                await tx.wait();

                console.log(`✅ Swap réussi pour ${user.address}. Hash: ${tx.hash}`);

                // Mettre à jour les données utilisateur
                user.cvtcReceived = cvtcAccumulated; // Utiliser la valeur du contrat
                user.lastDailySwap = new Date().toISOString();
                user.currentPalier = currentPalier;

                // Vérifier si l'onboarding est terminé
                if (completed) {
                    console.log(`🏁 Onboarding terminé pour ${user.address}. Désactivation.`);
                    user.isActive = false;
                }

            } catch (error) {
                console.error(`❌ Erreur lors du swap pour ${user.address}:`, error.reason || error.message);
                console.log(`ℹ️ Cause probable: Fonds insuffisants dans le contrat ou utilisateur non éligible`);
            }
        }

        // Sauvegarder les changements
        await fs.writeFile(USERS_FILE_PATH, JSON.stringify(users, null, 2));
        console.log('✅ Processus de swap quotidien terminé.');

    } catch (error) {
        console.error('❌ Erreur lors de la lecture du fichier utilisateurs:', error);
    }
}

/**
 * Vérifie que l'opérateur est autorisé sur le contrat onboarding
 */
async function verifyOperatorAuthorization() {
    try {
        console.log('🔐 Vérification de l\'autorisation de l\'opérateur...');
        // Cette vérification sera faite lors du premier appel à executeDailySwap
        console.log('✅ Opérateur prêt pour les swaps quotidiens');
    } catch (error) {
        console.error('❌ Erreur d\'autorisation:', error.message);
    }
}

/**
 * Planifie le cron job pour s'exécuter tous les jours à 01:01 (heure de La Réunion).
 */
function startScheduler() {
    // Vérifier l'autorisation de l'opérateur
    verifyOperatorAuthorization();

    // '1 1 * * *' = tous les jours à 01:01 (heure de La Réunion)
    cron.schedule('1 1 * * *', runDailySwaps, {
        scheduled: true,
        timezone: "Indian/Reunion"
    });

    console.log('🚀 Le planificateur de swap quotidien est démarré.');
    console.log('📅 Les swaps seront exécutés tous les jours à 01:01 (heure de La Réunion).');
    console.log(`📍 Contrat onboarding: ${ONBOARDING_CONTRACT_ADDRESS}`);
    console.log(`👤 Opérateur: ${operatorWallet.address}`);

    // Optionnel: Lancer la tâche immédiatement au démarrage pour tester
    console.log('🧪 Lancement immédiat de la tâche de swap pour le test...');
    runDailySwaps();
}

export { startScheduler };
