import { startUserOnboarding } from '../services/onboardingService.js';

async function triggerFirstSwap() {
    console.log("🚀 DÉCLENCHEMENT PREMIER SWAP");
    console.log("============================");

    // Adresse de l'utilisateur actuel (à remplacer par l'adresse réelle)
    const userAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"; // Remplacer par l'adresse réelle de l'utilisateur

    console.log(`👤 Utilisateur: ${userAddress}`);

    try {
        console.log("\\n🔄 Démarrage de l'onboarding avec premier swap...");
        await startUserOnboarding(userAddress);

        console.log("\\n✅ PREMIER SWAP DÉCLENCHÉ AVEC SUCCÈS!");
        console.log("=====================================");
        console.log("🎉 L'utilisateur devrait maintenant avoir des CVTC");
        console.log("📊 Vérifiez le solde dans l'application");

    } catch (error) {
        console.log("\\n❌ ERREUR LORS DU DÉCLENCHEMENT:");
        console.log("================================");
        console.error(error.message);

        console.log("\\n💡 POSSIBLES SOLUTIONS:");
        console.log("=======================");
        console.log("1. Vérifier que l'adresse utilisateur est correcte");
        console.log("2. Vérifier que l'opérateur a assez de BNB");
        console.log("3. Vérifier que le contrat a de la liquidité");
        console.log("4. Vérifier les permissions de whitelist");
    }
}

// Pour utiliser ce script, remplacez l'adresse par celle de l'utilisateur actuel
// triggerFirstSwap().catch(console.error);

export { triggerFirstSwap };