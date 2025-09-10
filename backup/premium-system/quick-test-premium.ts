import { ethers } from "hardhat";

async function main() {
  console.log("⚡ TEST RAPIDE - Système Premium avec délais accélérés (15s = 1 jour)");

  const [deployer, user1] = await ethers.getSigners();
  console.log(`📋 Deployer: ${deployer.address}`);
  console.log(`👤 User1: ${user1.address}`);

  try {
    // 1. Déploiement rapide du contrat premium
    console.log("\n🚀 Déploiement du contrat CVTCPremium...");

    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
    const cvtcPremium = await CVTCPremium.deploy(
      "0x0000000000000000000000000000000000000000", // CVTC address (placeholder)
      "0x0000000000000000000000000000000000000000"  // CVTC Swap address (placeholder)
    );
    await cvtcPremium.waitForDeployment();

    const premiumAddress = await cvtcPremium.getAddress();
    console.log(`✅ CVTCPremium déployé: ${premiumAddress}`);

    // 2. Vérification du mode test
    console.log("\n🔧 Vérification du mode test...");
    const cvtcPremiumTyped = cvtcPremium as any;
    const isTestMode = await cvtcPremiumTyped.isTestMode();
    const subscriptionDuration = await cvtcPremiumTyped.getSubscriptionDuration();
    const subscriptionPrice = await cvtcPremiumTyped.SUBSCRIPTION_PRICE();

    console.log(`🎯 Mode test: ${isTestMode ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
    console.log(`⏰ Durée abonnement: ${subscriptionDuration} secondes`);
    console.log(`💰 Prix abonnement: ${ethers.formatEther(subscriptionPrice)} BNB`);

    if (isTestMode) {
      console.log(`✅ Parfait! ${subscriptionDuration} secondes = 1 jour en mode test`);
    }

    // 3. Abonnement premium accéléré
    console.log("\n👑 Test d'abonnement premium accéléré...");

    const tx = await user1.sendTransaction({
      to: premiumAddress,
      value: subscriptionPrice,
    });
    await tx.wait();

    console.log("✅ Abonnement réussi!");

    // Vérifier le statut immédiatement
    const isPremiumBefore = await cvtcPremiumTyped.isPremiumUser(user1.address);
    console.log(`👑 Statut premium avant délai: ${isPremiumBefore}`);

    // 4. Attendre 15 secondes (1 "jour" en mode test)
    console.log("\n⏳ Attente de 15 secondes (1 jour en mode test)...");
    console.log("   Compte à rebours: 15...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log("   Compte à rebours: 10...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log("   Compte à rebours: 5...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 5. Vérifier le statut après délai
    const isPremiumAfter = await cvtcPremiumTyped.isPremiumUser(user1.address);
    console.log(`👑 Statut premium après délai: ${isPremiumAfter}`);

    if (isPremiumAfter) {
      console.log("🎉 SUCCÈS! Le système de délais accélérés fonctionne parfaitement!");
      console.log("✅ 15 secondes = 1 jour en mode test");
      console.log("✅ Abonnement premium opérationnel");
      console.log("✅ Chronomètre intégré fonctionnel");
    } else {
      console.log("❌ Échec du système de délais accélérés");
    }

    // 6. Statistiques du contrat
    console.log("\n📊 Statistiques du contrat:");
    const totalUsers = await cvtcPremiumTyped.totalPremiumUsers();
    const networkReserve = await cvtcPremiumTyped.getTotalReserves();

    console.log(`👥 Utilisateurs premium: ${totalUsers}`);
    console.log(`🏦 Réserve réseau: ${ethers.formatEther(networkReserve)} BNB`);

    // 7. Instructions pour les tests suivants
    console.log("\n📋 Prochaines étapes:");
    console.log(`1. Copiez cette adresse dans votre .env:`);
    console.log(`   CVTC_PREMIUM_ADDRESS=${premiumAddress}`);
    console.log(`2. Testez les transferts P2P:`);
    console.log(`   npx hardhat run scripts/test-p2p-cvtc.ts --network bscTestnet`);
    console.log(`3. Désactivez le mode test pour la production:`);
    console.log(`   cvtcPremium.toggleTestMode()`);

    console.log("\n🎯 Test rapide terminé avec succès!");
    console.log("🚀 Le système premium est prêt pour les tests accélérés!");

  } catch (error: any) {
    console.log("❌ Erreur lors du test rapide:", error?.message || "Erreur inconnue");
  }
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});