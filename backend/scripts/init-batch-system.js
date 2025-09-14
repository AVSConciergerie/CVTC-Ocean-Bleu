import { addMissedDailySwaps } from '../services/batchActionService.js';
import fs from 'fs/promises';
import path from 'path';

console.log('🚀 INITIALISATION DU SYSTÈME DE BATCHING');
console.log('======================================');

/**
 * Initialise le système de batching
 */
async function initBatchSystem() {
    try {
        console.log('📁 Étape 1: Vérification des fichiers de données...');

        // Vérifier que le fichier users.json existe
        const usersPath = path.resolve(process.cwd(), 'data/users.json');
        try {
            await fs.access(usersPath);
            console.log('✅ users.json trouvé');
        } catch {
            console.log('❌ users.json non trouvé - Création d\'un exemple...');
            const exampleUsers = [
                {
                    address: "0x04554bd13ddaa139d7d84953841562ca8eb55d1b",
                    isActive: true,
                    onboardingStartDate: "2025-09-10T00:00:00.000Z",
                    lastDailySwap: "2025-09-10T00:00:00.000Z",
                    cvtcReceived: 1200
                }
            ];
            await fs.writeFile(usersPath, JSON.stringify(exampleUsers, null, 2));
            console.log('✅ users.json créé avec un exemple');
        }

        // Vérifier que le fichier pending-actions.json existe
        const actionsPath = path.resolve(process.cwd(), 'data/pending-actions.json');
        try {
            await fs.access(actionsPath);
            console.log('✅ pending-actions.json trouvé');
        } catch {
            console.log('❌ pending-actions.json non trouvé - Sera créé automatiquement');
        }

        console.log('');
        console.log('🔄 Étape 2: Analyse des actions manquées...');
        await addMissedDailySwaps();

        console.log('');
        console.log('✅ Initialisation terminée!');
        console.log('');
        console.log('📋 Prochaines étapes:');
        console.log('1. Exécuter: node scripts/test-batch-system.js');
        console.log('2. Ou directement: node scripts/catch-up-with-batch.js');
        console.log('3. Vérifier les résultats dans l\'application');

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
    }
}

// Exécuter l'initialisation
initBatchSystem().catch(console.error);