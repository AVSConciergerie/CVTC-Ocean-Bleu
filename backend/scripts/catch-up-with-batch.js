import { addMissedDailySwaps, getPendingActionsStatus, executeBatch } from '../services/batchActionService.js';

console.log('🔧 RATTRAPAGE DES 3 JOURS MANQUÉS AVEC BATCHING');
console.log('===============================================');

/**
 * Rattrape les swaps manqués en utilisant le système de batching
 */
async function catchUpWithBatching() {
    try {
        console.log('📅 Étape 1: Analyse des swaps manqués...');
        await addMissedDailySwaps();
        console.log('');

        // Pour simplifier, on va traiter l'utilisateur principal
        const TEST_USER = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

        console.log('📊 Étape 2: Vérification du statut...');
        const status = await getPendingActionsStatus(TEST_USER);
        console.log(`   Actions en attente: ${status.pending}`);
        console.log(`   Seuil batch atteint: ${status.canTriggerBatch ? '✅ OUI' : '❌ NON'}`);
        console.log('');

        if (status.pending >= 3) {
            console.log('🚀 Étape 3: Déclenchement du batch automatique...');
            await executeBatch(TEST_USER);
        } else {
            console.log('ℹ️ Pas assez d\'actions pour déclencher automatiquement.');
            console.log('💡 Les actions s\'accumuleront jusqu\'au seuil de 3.');
            console.log('💡 Ou vous pouvez ajouter manuellement d\'autres actions.');
        }

        console.log('');
        console.log('✅ Rattrapage terminé!');

    } catch (error) {
        console.error('❌ Erreur lors du rattrapage:', error);
    }
}

// Exécuter le rattrapage
catchUpWithBatching().catch(console.error);