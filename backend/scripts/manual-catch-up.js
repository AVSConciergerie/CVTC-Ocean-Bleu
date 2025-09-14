import { addPendingAction, forceExecuteBatch, ACTION_TYPES } from '../services/batchActionService.js';

console.log('🔧 RATTRAPAGE MANUEL DES 3 JOURS MANQUÉS');
console.log('=======================================');

// Adresse de l'utilisateur principal
const MAIN_USER = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

/**
 * Ajoute manuellement les 3 swaps manqués
 */
async function addManualMissedSwaps() {
    console.log('📝 Ajout manuel des 3 swaps manqués...');

    try {
        // Ajouter 3 actions de swap quotidien manquées
        for (let i = 1; i <= 3; i++) {
            await addPendingAction(MAIN_USER, ACTION_TYPES.DAILY_SWAP, {
                reason: `manual_catch_up_day_${i}`,
                day: i,
                manual: true
            });
            console.log(`✅ Action ${i}/3 ajoutée`);
        }

        console.log('');
        console.log('⚡ Exécution forcée des actions...');
        const result = await forceExecuteBatch(MAIN_USER);

        console.log('');
        console.log('🎉 Rattrapage terminé!');
        console.log(`📊 ${result.executed} actions exécutées`);

    } catch (error) {
        console.error('❌ Erreur lors du rattrapage manuel:', error);
    }
}

// Exécuter le rattrapage manuel
addManualMissedSwaps().catch(console.error);