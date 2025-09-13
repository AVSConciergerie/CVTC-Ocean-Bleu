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

// ABI minimal pour interagir avec le contrat CVTCOnboarding
const onboardingABI = [
    "function batchSwap(address user) external",
    "function whitelist(address user) external view returns (bool)"
];

// Chemin vers le fichier des utilisateurs
const USERS_FILE_PATH = path.resolve(new URL('.', import.meta.url).pathname, '../data/users.json');

// Initialiser le provider et le wallet de l'opérateur
const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);

// Initialiser l'instance du contrat
const onboardingContract = new ethers.Contract(CVTC_ONBOARDING_CONTRACT_ADDRESS, onboardingABI, operatorWallet);

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
 * Exécute le batchSwap pour tous les utilisateurs enregistrés et whitelistés.
 */
async function runDailySwaps() {
    console.log('[SIMULATION] Démarrage du processus de swap quotidien...');

    try {
        const data = await fs.readFile(USERS_FILE_PATH, 'utf8');
        const users = JSON.parse(data);
        const activeUsers = users.filter(u => u.isActive);

        if (activeUsers.length === 0) {
            console.log('[SIMULATION] Aucun utilisateur actif trouvé.');
            return;
        }

        console.log(`🔄 Trouvé ${activeUsers.length} utilisateurs actifs. Exécution des swaps quotidiens...`);

        for (const user of activeUsers) {
            try {
                // Vérifier si l'utilisateur est whitelisted sur la blockchain
                const isWhitelisted = await onboardingContract.whitelist(user.address);
                if (!isWhitelisted) {
                    console.log(`⚠️ L'utilisateur ${user.address} n'est pas whitelisted. Swap ignoré.`);
                    continue;
                }

                // Exécuter le swap réel quotidien
                console.log(`🔄 Exécution du swap réel pour ${user.address}...`);
                const minCvtcOut = 1; // Minimum attendu
                const tx = await onboardingContract.buy(minCvtcOut, {
                    value: ethers.parseEther("0.01"), // Swap quotidien
                    gasLimit: 300000
                });
                await tx.wait();
                console.log(`✅ Swap réussi pour ${user.address}. Hash: ${tx.hash}`);

                // Mettre à jour les données utilisateur
                user.cvtcReceived = (user.cvtcReceived || 0) + 14.00; // Estimation
                user.lastDailySwap = new Date().toISOString();

                // Vérifier si l'onboarding de 30 jours est terminé
                const startDate = new Date(user.onboardingStartDate);
                const thirtyDays = 30 * 24 * 60 * 60 * 1000;
                if (new Date() - startDate > thirtyDays) {
                    console.log(`🏁 Onboarding terminé pour ${user.address}. Désactivation.`);
                    user.isActive = false;
                }

            } catch (error) {
                console.error(`❌ Erreur lors du swap pour ${user.address}:`, error.reason || error.message);
                console.log(`ℹ️ Cause probable: Pas de liquidité ou fonds insuffisants`);
            }
        }

        // Sauvegarder les changements
        await fs.writeFile(USERS_FILE_PATH, JSON.stringify(users, null, 2));
        console.log('[SIMULATION] Processus de swap quotidien terminé.');

    } catch (error) {
        console.error('[SIMULATION] Erreur lors de la lecture du fichier utilisateurs:', error);
    }
}

/**
 * Planifie le cron job pour s'exécuter tous les jours à 01:01 (heure de La Réunion).
 */
function startScheduler() {
    // '1 1 * * *' = tous les jours à 01:01 (heure de La Réunion)
    cron.schedule('1 1 * * *', runDailySwaps, {
        scheduled: true,
        timezone: "Indian/Reunion"
    });

    console.log('🚀 Le planificateur de swap quotidien est démarré. Les swaps seront exécutés tous les jours à 01:01 (heure de La Réunion).');

    // Optionnel: Lancer la tâche immédiatement au démarrage pour tester
    console.log('Lancement immédiat de la tâche de swap pour le test...');
    runDailySwaps();
}

export { startScheduler };
