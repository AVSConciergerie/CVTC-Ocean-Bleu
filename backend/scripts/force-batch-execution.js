import { forceExecuteBatch, executeSingleAction, getPendingActionsStatus, addPendingAction, ACTION_TYPES } from '../services/batchActionService.js';

console.log('⚡ TEST D\'EXÉCUTION FORCÉE DU BATCH');
console.log('==================================');

// Adresse de test
const TEST_USER = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

/**
 * Test des fonctionnalités d'exécution forcée
 */
async function testForceExecution() {
    try {
        console.log('📝 Test 1: Ajout de quelques actions...');
        await addPendingAction(TEST_USER, ACTION_TYPES.DAILY_SWAP, { reason: 'test_force_1' });
        await addPendingAction(TEST_USER, ACTION_TYPES.P2P_TRANSFER, {
            recipient: '0x1234567890123456789012345678901234567890',
            amount: '50'
        });
        console.log('');

        // Vérifier le statut
        console.log('📊 Statut actuel:');
        const status = await getPendingActionsStatus(TEST_USER);
        console.log(`   Actions en attente: ${status.pending}`);
        console.log(`   Seuil batch atteint: ${status.canTriggerBatch ? '✅ OUI' : '❌ NON'}`);
        console.log('');

        if (status.pending < 3) {
            console.log('🔧 Test 2: Exécution forcée (ignore le seuil)...');
            const result = await forceExecuteBatch(TEST_USER);
            console.log(`   Résultat: ${result.message}`);
            console.log('');
        }

        console.log('🎯 Test 3: Ajout d\'une action et exécution unique...');

        // Ajouter une nouvelle action
        const action = await addPendingAction(TEST_USER, ACTION_TYPES.DAILY_SWAP, { reason: 'single_execution_test' });
        console.log(`   Action ajoutée avec ID: ${action.id}`);

        // Exécuter seulement cette action
        const singleResult = await executeSingleAction(TEST_USER, action.id);
        console.log(`   Résultat exécution unique: ${singleResult.message}`);
        console.log('');

        console.log('📋 Test 4: Statut final...');
        const finalStatus = await getPendingActionsStatus(TEST_USER);
        console.log(`   Actions restantes: ${finalStatus.pending}`);
        console.log(`   Actions terminées: ${finalStatus.completed}`);
        console.log(`   Actions échouées: ${finalStatus.failed}`);
        console.log('');

        console.log('✅ Tests d\'exécution forcée terminés!');

    } catch (error) {
        console.error('❌ Erreur lors des tests:', error);
    }
}

// Exécuter les tests
testForceExecution().catch(console.error);