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
        // Retourne les clés de l'objet, qui sont les adresses de wallet
        return Object.keys(users);
    } catch (error) {
        console.error("Erreur lors de la lecture du fichier des utilisateurs:", error);
        return [];
    }
}

/**
 * Exécute le batchSwap pour tous les utilisateurs enregistrés et whitelistés.
 */
async function runDailySwaps() {
    console.log('Démarrage du processus de swap quotidien...');
    const users = await getRegisteredUsers();

    if (users.length === 0) {
        console.log('Aucun utilisateur trouvé. Le processus de swap est terminé.');
        return;
    }

    console.log(`Trouvé ${users.length} utilisateurs. Vérification de la whitelist et exécution des swaps...`);

    for (const userAddress of users) {
        try {
            // 1. Vérifier si l'utilisateur est bien sur la whitelist du contrat
            const isWhitelisted = await onboardingContract.whitelist(userAddress);
            if (!isWhitelisted) {
                console.log(`L'utilisateur ${userAddress} n'est pas sur la whitelist. Swap ignoré.`);
                continue;
            }

            // 2. Exécuter le swap
            console.log(`Exécution du swap pour l'utilisateur ${userAddress}...`);
            const tx = await onboardingContract.batchSwap(userAddress, {
                gasLimit: 300000 // Augmenter la limite de gaz pour être sûr
            });
            await tx.wait();
            console.log(`Swap réussi pour ${userAddress}. Hash de la transaction: ${tx.hash}`);

        } catch (error) {
            console.error(`Erreur lors du swap pour l'utilisateur ${userAddress}:`, error.reason || error.message);
        }
    }

    console.log('Processus de swap quotidien terminé.');
}

/**
 * Planifie le cron job pour s'exécuter tous les jours à 00:01 (une minute après minuit).
 */
function startScheduler() {
    // '1 0 * * *' = tous les jours à 00:01
    cron.schedule('1 0 * * *', runDailySwaps, {
        scheduled: true,
        timezone: "Europe/Paris"
    });

    console.log('🚀 Le planificateur de swap quotidien est démarré. Les swaps seront exécutés tous les jours à 00:01 (Paris).');

    // Optionnel: Lancer la tâche immédiatement au démarrage pour tester
    // console.log('Lancement immédiat de la tâche de swap pour le test...');
    // runDailySwaps();
}

export { startScheduler };
