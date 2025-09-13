import { startUserOnboarding } from '../services/onboardingService.js';

async function executeFirstSwap() {
    console.log("🚀 EXÉCUTION PREMIER SWAP POUR UTILISATEUR ACTUEL");
    console.log("================================================");

    // Adresse de l'utilisateur actuel depuis users.json
    const userAddress = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

    console.log(`👤 Utilisateur: ${userAddress}`);
    console.log(`📅 Date d'onboarding: Depuis le fichier users.json`);
    console.log(`🔄 Statut: Prêt pour le premier swap`);

    try {
        console.log("\\n🔄 Exécution du premier swap...");
        await startUserOnboarding(userAddress);

        console.log("\\n✅ SUCCÈS ! PREMIER SWAP EXÉCUTÉ");
        console.log("===============================");
        console.log("🎉 L'utilisateur devrait maintenant avoir:");
        console.log("   - Premier swap complété");
        console.log("   - CVTC reçus du swap");
        console.log("   - Statut mis à jour");

        console.log("\\n📊 PROCHAINES ÉTAPES:");
        console.log("====================");
        console.log("1. Vérifier le solde CVTC dans l'application");
        console.log("2. Confirmer que firstSwapCompleted = true");
        console.log("3. Les swaps quotidiens commenceront automatiquement");

    } catch (error) {
        console.log("\\n❌ ERREUR LORS DE L'EXÉCUTION:");
        console.log("=============================");
        console.error("Détails:", error.message);

        console.log("\\n🔧 DIAGNOSTIC:");
        console.log("==============");
        console.log("1. Vérifier le solde BNB de l'opérateur");
        console.log("2. Vérifier la liquidité du contrat swap");
        console.log("3. Vérifier les permissions whitelist");
        console.log("4. Vérifier la configuration réseau");
    }
}

executeFirstSwap().catch(console.error);