import fs from 'fs/promises';
import path from 'path';

// Chemin vers le fichier des utilisateurs
const USERS_FILE_PATH = path.resolve(process.cwd(), 'data/users.json');

/**
 * Calcule le nombre de jours de swap manqués
 */
function calculateMissedDays(user) {
    const now = new Date();
    const lastSwap = new Date(user.lastDailySwap || user.onboardingStartDate);
    const daysSinceLastSwap = Math.floor((now - lastSwap) / (1000 * 60 * 60 * 24));

    console.log(`🔍 Calcul pour ${user.address}:`);
    console.log(`   Maintenant: ${now.toISOString()}`);
    console.log(`   Dernier swap: ${lastSwap.toISOString()}`);
    console.log(`   Jours écoulés: ${daysSinceLastSwap}`);
    console.log(`   Swaps manqués calculés: ${Math.min(Math.max(0, daysSinceLastSwap - 1), 7)}`);

    return Math.min(Math.max(0, daysSinceLastSwap - 1), 7); // Max 7 jours
}

/**
 * Debug des swaps manqués
 */
async function debugMissedSwaps() {
    console.log('🔍 DEBUG DES SWAPS MANQUÉS');
    console.log('===========================');

    try {
        const usersData = await fs.readFile(USERS_FILE_PATH, 'utf8');
        const users = JSON.parse(usersData);
        const activeUsers = users.filter(u => u.isActive);

        console.log(`👥 Utilisateurs actifs trouvés: ${activeUsers.length}`);
        console.log('');

        for (const user of activeUsers) {
            console.log(`🔍 Analyse de ${user.address}:`);
            console.log(`   Actif: ${user.isActive}`);
            console.log(`   Date d'onboarding: ${user.onboardingStartDate}`);
            console.log(`   Dernier swap: ${user.lastDailySwap}`);
            console.log(`   Premier swap complété: ${user.firstSwapCompleted}`);
            console.log('');

            const missedDays = calculateMissedDays(user);
            console.log(`   Résultat: ${missedDays} swaps manqués`);
            console.log('   ---');
            console.log('');
        }

    } catch (error) {
        console.error('❌ Erreur lors du debug:', error);
    }
}

// Exécuter le debug
debugMissedSwaps().catch(console.error);