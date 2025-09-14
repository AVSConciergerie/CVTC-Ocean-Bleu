import { addMissedDailySwaps, forceExecuteBatch } from '../services/batchActionService.js';

console.log('⚡ RATTRAPAGE IMMÉDIAT DES 3 JOURS MANQUÉS');
console.log('==========================================');

/**
 * Rattrape immédiatement les swaps manqués sans attendre le batch
 */
async function immediateCatchUp() {
    try {
        console.log('🔍 Étape 1: Détection des swaps manqués...');
        await addMissedDailySwaps();
        console.log('');

        // Adresse de l'utilisateur principal
        const MAIN_USER = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

        console.log('⚡ Étape 2: Exécution forcée immédiate...');
        const result = await forceExecuteBatch(MAIN_USER);
        console.log(`   ${result.message}`);
        console.log('');

        console.log('✅ Rattrapage immédiat terminé!');
        console.log('');
        console.log('💡 Les 3 jours manqués ont été rattrapés immédiatement.');
        console.log('💡 Le système reprendra son fonctionnement normal demain.');

    } catch (error) {
        console.error('❌ Erreur lors du rattrapage immédiat:', error);
    }
}

// Exécuter le rattrapage immédiat
immediateCatchUp().catch(console.error);