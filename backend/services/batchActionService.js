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

// Chemin vers les fichiers de données
const USERS_FILE_PATH = path.resolve(process.cwd(), 'data/users.json');
const PENDING_ACTIONS_FILE_PATH = path.resolve(process.cwd(), 'data/pending-actions.json');

// Initialiser le provider et le wallet
const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);
const onboardingContract = new ethers.Contract(ONBOARDING_CONTRACT_ADDRESS, onboardingABI, operatorWallet);

// Types d'actions
const ACTION_TYPES = {
    DAILY_SWAP: 'daily_swap',
    P2P_TRANSFER: 'p2p_transfer',
    PREMIUM_SUBSCRIPTION: 'premium_subscription'
};

// Seuil pour déclencher le batch
const BATCH_THRESHOLD = 3;

/**
 * Initialise le fichier des actions en attente s'il n'existe pas
 */
async function initializePendingActionsFile() {
    try {
        await fs.access(PENDING_ACTIONS_FILE_PATH);
    } catch {
        // Fichier n'existe pas, le créer
        const initialData = {
            users: {},
            lastUpdated: new Date().toISOString()
        };
        await fs.writeFile(PENDING_ACTIONS_FILE_PATH, JSON.stringify(initialData, null, 2));
    }
}

/**
 * Lit les actions en attente
 */
async function getPendingActions() {
    try {
        const data = await fs.readFile(PENDING_ACTIONS_FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lecture actions en attente:', error);
        return { users: {}, lastUpdated: new Date().toISOString() };
    }
}

/**
 * Sauvegarde les actions en attente
 */
async function savePendingActions(actions) {
    try {
        actions.lastUpdated = new Date().toISOString();
        await fs.writeFile(PENDING_ACTIONS_FILE_PATH, JSON.stringify(actions, null, 2));
    } catch (error) {
        console.error('Erreur sauvegarde actions en attente:', error);
    }
}

/**
 * Ajoute une action en attente pour un utilisateur
 */
async function addPendingAction(userAddress, actionType, actionData = {}) {
    await initializePendingActionsFile();
    const actions = await getPendingActions();

    if (!actions.users[userAddress]) {
        actions.users[userAddress] = [];
    }

    const action = {
        id: Date.now() + Math.random(),
        type: actionType,
        data: actionData,
        createdAt: new Date().toISOString(),
        status: 'pending'
    };

    actions.users[userAddress].push(action);
    await savePendingActions(actions);

    console.log(`📝 Action ${actionType} ajoutée pour ${userAddress}`);

    // Vérifier si on peut déclencher le batch
    await checkAndTriggerBatch(userAddress);

    return action;
}

/**
 * Vérifie et déclenche le batch si le seuil est atteint
 */
async function checkAndTriggerBatch(userAddress) {
    const actions = await getPendingActions();
    const userActions = actions.users[userAddress] || [];
    const pendingActions = userActions.filter(a => a.status === 'pending');

    console.log(`🔍 ${userAddress}: ${pendingActions.length} actions en attente`);

    if (pendingActions.length >= BATCH_THRESHOLD) {
        console.log(`🚀 Seuil atteint! Déclenchement du batch pour ${userAddress}`);
        await executeBatch(userAddress);
    }
}

/**
 * Force l'exécution immédiate des actions en attente (ignore le seuil)
 */
async function forceExecuteBatch(userAddress) {
    console.log(`⚡ EXÉCUTION FORCÉE DU BATCH pour ${userAddress}`);
    console.log('===============================================');

    const actions = await getPendingActions();
    const userActions = actions.users[userAddress] || [];
    const pendingActions = userActions.filter(a => a.status === 'pending');

    if (pendingActions.length === 0) {
        console.log('ℹ️ Aucune action en attente à exécuter');
        return { executed: 0, message: 'Aucune action en attente' };
    }

    console.log(`🔧 Forçage de ${pendingActions.length} actions (seuil ignoré)`);
    await executeBatch(userAddress);

    return {
        executed: pendingActions.length,
        message: `${pendingActions.length} actions exécutées immédiatement`
    };
}

/**
 * Exécute une seule action spécifique immédiatement
 */
async function executeSingleAction(userAddress, actionId) {
    console.log(`🎯 EXÉCUTION UNIQUE pour ${userAddress} - Action: ${actionId}`);

    const actions = await getPendingActions();
    const userActions = actions.users[userAddress] || [];
    const action = userActions.find(a => a.id == actionId && a.status === 'pending');

    if (!action) {
        console.log('❌ Action non trouvée ou déjà traitée');
        return { success: false, message: 'Action non trouvée' };
    }

    try {
        console.log(`🔄 Exécution de: ${action.type}`);
        const success = await executeAction(userAddress, action);

        if (success) {
            action.status = 'completed';
            action.completedAt = new Date().toISOString();
            console.log(`✅ Action exécutée avec succès`);
        } else {
            action.status = 'failed';
            action.failedAt = new Date().toISOString();
            console.log(`❌ Échec de l'exécution`);
        }

        await savePendingActions(actions);

        return {
            success,
            actionType: action.type,
            message: success ? 'Action exécutée' : 'Échec de l\'exécution'
        };

    } catch (error) {
        console.error('❌ Erreur exécution unique:', error.message);
        action.status = 'failed';
        action.error = error.message;
        await savePendingActions(actions);

        return { success: false, message: error.message };
    }
}

/**
 * Exécute toutes les actions en attente pour un utilisateur
 */
async function executeBatch(userAddress) {
    console.log(`🔄 EXÉCUTION DU BATCH pour ${userAddress}`);
    console.log('=====================================');

    const actions = await getPendingActions();
    const userActions = actions.users[userAddress] || [];
    const pendingActions = userActions.filter(a => a.status === 'pending');

    if (pendingActions.length === 0) {
        console.log('ℹ️ Aucune action en attente');
        return;
    }

    let successfulActions = 0;
    let failedActions = 0;

    for (const action of pendingActions) {
        try {
            console.log(`🔄 Exécution: ${action.type}`);

            const success = await executeAction(userAddress, action);

            if (success) {
                action.status = 'completed';
                action.completedAt = new Date().toISOString();
                successfulActions++;
                console.log(`✅ ${action.type} réussi`);
            } else {
                action.status = 'failed';
                action.failedAt = new Date().toISOString();
                failedActions++;
                console.log(`❌ ${action.type} échoué`);
            }

        } catch (error) {
            console.error(`❌ Erreur exécution ${action.type}:`, error.message);
            action.status = 'failed';
            action.error = error.message;
            failedActions++;
        }
    }

    // Sauvegarder les résultats
    await savePendingActions(actions);

    console.log('');
    console.log('📊 RÉSULTATS DU BATCH:');
    console.log(`✅ Actions réussies: ${successfulActions}`);
    console.log(`❌ Actions échouées: ${failedActions}`);
    console.log(`📋 Total traité: ${successfulActions + failedActions}`);

    // Nettoyer les actions anciennes (garder seulement les 10 dernières)
    await cleanupOldActions(userAddress);
}

/**
 * Exécute une action spécifique
 */
async function executeAction(userAddress, action) {
    switch (action.type) {
        case ACTION_TYPES.DAILY_SWAP:
            return await executeDailySwap(userAddress);

        case ACTION_TYPES.P2P_TRANSFER:
            return await executeP2PTransfer(userAddress, action.data);

        case ACTION_TYPES.PREMIUM_SUBSCRIPTION:
            return await executePremiumSubscription(userAddress, action.data);

        default:
            console.log(`⚠️ Type d'action inconnu: ${action.type}`);
            return false;
    }
}

/**
 * Exécute un swap quotidien
 */
async function executeDailySwap(userAddress) {
    try {
        // Vérifier le statut d'onboarding
        const status = await onboardingContract.getUserOnboardingStatus(userAddress);
        const [isActive, completed] = status;

        if (!isActive || completed) {
            console.log(`⚠️ Utilisateur inactif ou onboarding terminé`);
            return false;
        }

        // Exécuter le swap
        const tx = await onboardingContract.executeDailySwap(userAddress);
        await tx.wait();

        console.log(`💱 Swap quotidien exécuté - Hash: ${tx.hash}`);
        return true;

    } catch (error) {
        console.error('Erreur swap quotidien:', error.message);
        return false;
    }
}

/**
 * Exécute un transfert P2P (placeholder - à implémenter)
 */
async function executeP2PTransfer(userAddress, transferData) {
    try {
        // TODO: Implémenter la logique de transfert P2P
        console.log(`💸 Transfert P2P simulé: ${transferData.amount} vers ${transferData.recipient}`);
        // Ici on intégrera la vraie logique de P2P
        return true;
    } catch (error) {
        console.error('Erreur transfert P2P:', error.message);
        return false;
    }
}

/**
 * Exécute une souscription premium (placeholder - à implémenter)
 */
async function executePremiumSubscription(userAddress, subscriptionData) {
    try {
        // TODO: Implémenter la logique de souscription premium
        console.log(`⭐ Souscription premium simulée: ${subscriptionData.plan}`);
        // Ici on intégrera la vraie logique premium
        return true;
    } catch (error) {
        console.error('Erreur souscription premium:', error.message);
        return false;
    }
}

/**
 * Nettoie les anciennes actions (garde seulement les 10 dernières)
 */
async function cleanupOldActions(userAddress) {
    const actions = await getPendingActions();
    const userActions = actions.users[userAddress] || [];

    if (userActions.length > 10) {
        // Trier par date et garder les 10 plus récentes
        userActions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        actions.users[userAddress] = userActions.slice(0, 10);
        await savePendingActions(actions);
        console.log('🧹 Actions anciennes nettoyées');
    }
}

/**
 * Obtient le statut des actions en attente pour un utilisateur
 */
async function getPendingActionsStatus(userAddress) {
    const actions = await getPendingActions();
    const userActions = actions.users[userAddress] || [];
    const pending = userActions.filter(a => a.status === 'pending');

    return {
        total: userActions.length,
        pending: pending.length,
        completed: userActions.filter(a => a.status === 'completed').length,
        failed: userActions.filter(a => a.status === 'failed').length,
        canTriggerBatch: pending.length >= BATCH_THRESHOLD
    };
}

/**
 * Déclenche manuellement le batch pour un utilisateur
 */
async function triggerManualBatch(userAddress) {
    console.log(`🔧 Déclenchement manuel du batch pour ${userAddress}`);
    await executeBatch(userAddress);
}

/**
 * Ajoute automatiquement les swaps quotidiens manqués
 */
async function addMissedDailySwaps() {
    console.log('🔍 Recherche des swaps quotidiens manqués...');

    try {
        const usersData = await fs.readFile(USERS_FILE_PATH, 'utf8');
        const users = JSON.parse(usersData);
        const activeUsers = users.filter(u => u.isActive);

        for (const user of activeUsers) {
            const missedDays = calculateMissedDays(user);

            if (missedDays > 0) {
                console.log(`📅 ${user.address}: ${missedDays} swaps manqués`);

                // Ajouter les swaps manqués comme actions en attente
                for (let i = 0; i < missedDays; i++) {
                    await addPendingAction(user.address, ACTION_TYPES.DAILY_SWAP, {
                        day: i + 1,
                        reason: 'missed_daily_swap'
                    });
                }
            }
        }

        console.log('✅ Swaps manqués ajoutés au système de batch');

    } catch (error) {
        console.error('Erreur ajout swaps manqués:', error);
    }
}

/**
 * Calcule le nombre de jours de swap manqués
 */
function calculateMissedDays(user) {
    const now = new Date();
    const lastSwap = new Date(user.lastDailySwap || user.onboardingStartDate);

    // Calcul plus précis en utilisant les dates sans les heures
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastSwapDate = new Date(lastSwap.getFullYear(), lastSwap.getMonth(), lastSwap.getDate());

    const daysSinceLastSwap = Math.floor((nowDate - lastSwapDate) / (1000 * 60 * 60 * 24));

    // Retourner le nombre de jours manqués (daysSinceLastSwap - 1 car le dernier jour ne compte pas)
    return Math.min(Math.max(0, daysSinceLastSwap - 1), 7); // Max 7 jours
}

export {
    addPendingAction,
    executeBatch,
    getPendingActionsStatus,
    triggerManualBatch,
    addMissedDailySwaps,
    forceExecuteBatch,
    executeSingleAction,
    ACTION_TYPES,
    BATCH_THRESHOLD
};