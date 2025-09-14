import { addPendingAction, executeBatch, getPendingActionsStatus, triggerManualBatch, addMissedDailySwaps, forceExecuteBatch, executeSingleAction, ACTION_TYPES } from '../services/batchActionService.js';

console.log('🧪 TEST DU SYSTÈME DE BATCHING INTELLIGENT');
console.log('=========================================');

// Adresse de test (à remplacer par une vraie adresse)
const TEST_USER = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

/**
 * Test du système de batching
 */
async function testBatchSystem() {
    try {
        console.log('📝 Test 1: Ajout d\'actions en attente...');
        console.log('');

        // Ajouter des swaps quotidiens manqués
        console.log('🔄 Ajout des swaps quotidiens manqués...');
        await addMissedDailySwaps();
        console.log('');

        // Ajouter manuellement quelques actions
        console.log('📝 Ajout d\'actions manuelles...');
        await addPendingAction(TEST_USER, ACTION_TYPES.DAILY_SWAP, { reason: 'test_swap_1' });
        await addPendingAction(TEST_USER, ACTION_TYPES.P2P_TRANSFER, {
            recipient: '0x1234567890123456789012345678901234567890',
            amount: '100'
        });
        await addPendingAction(TEST_USER, ACTION_TYPES.PREMIUM_SUBSCRIPTION, { plan: 'premium_monthly' });
        console.log('');

        // Vérifier le statut
        console.log('📊 Statut des actions en attente:');
        const status = await getPendingActionsStatus(TEST_USER);
        console.log(`   Total: ${status.total}`);
        console.log(`   En attente: ${status.pending}`);
        console.log(`   Terminées: ${status.completed}`);
        console.log(`   Échouées: ${status.failed}`);
        console.log(`   Peut déclencher batch: ${status.canTriggerBatch ? '✅ OUI' : '❌ NON'}`);
        console.log('');

        // Si on peut déclencher le batch, le faire
        if (status.canTriggerBatch) {
            console.log('🚀 Déclenchement automatique du batch...');
            await executeBatch(TEST_USER);
        } else {
            console.log('🔧 Seuil non atteint, ajout d\'une action supplémentaire...');
            await addPendingAction(TEST_USER, ACTION_TYPES.DAILY_SWAP, { reason: 'test_swap_2' });

            // Revérifier
            const newStatus = await getPendingActionsStatus(TEST_USER);
            console.log(`   Nouvelles actions en attente: ${newStatus.pending}`);
            console.log(`   Peut déclencher batch: ${newStatus.canTriggerBatch ? '✅ OUI' : '❌ NON'}`);

            if (newStatus.canTriggerBatch) {
                console.log('🚀 Déclenchement du batch avec action supplémentaire...');
                await executeBatch(TEST_USER);
            }
        }

        console.log('');
        console.log('⚡ Test 2: Exécution forcée (ignore le seuil)...');
        const forceResult = await forceExecuteBatch(TEST_USER);
        console.log(`   Résultat: ${forceResult.message}`);
        console.log('');

        console.log('🎯 Test 3: Exécution d\'une action unique...');
        const singleAction = await addPendingAction(TEST_USER, ACTION_TYPES.DAILY_SWAP, { reason: 'single_test' });
        const singleResult = await executeSingleAction(TEST_USER, singleAction.id);
        console.log(`   Résultat: ${singleResult.message}`);
        console.log('');

        console.log('📋 Test 4: Déclenchement manuel du batch...');
        await triggerManualBatch(TEST_USER);

        console.log('');
        console.log('✅ Tests terminés!');

    } catch (error) {
        console.error('❌ Erreur lors des tests:', error);
    }
}

// Exécuter les tests
testBatchSystem().catch(console.error);