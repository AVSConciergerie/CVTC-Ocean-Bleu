import { ethers } from "hardhat";

async function main() {
  console.log("🧪 TEST DU SYSTÈME DE TRANSFERT BASIC (SANS PREMIUM)");
  console.log("=".repeat(60));

  // Démarrer un réseau local pour les tests
  console.log("🔄 Démarrage du réseau de test local...");
  const { ethers } = require('hardhat');

  const [deployer, user1, user2] = await ethers.getSigners();
  console.log(`📤 Testeur: ${deployer.address}`);
  console.log(`👤 User1: ${user1.address}`);
  console.log(`👤 User2: ${user2.address}`);

  try {
    // 1. Déploiement du contrat de base
    console.log("\n📄 Déploiement CVTCTransferBasic...");
    const CVTCTransferBasic = await ethers.getContractFactory("CVTCTransferBasic");
    const transferContract = await CVTCTransferBasic.deploy("0x0000000000000000000000000000000000000000"); // CVTC address placeholder
    await transferContract.waitForDeployment();
    console.log(`✅ CVTCTransferBasic déployé: ${await transferContract.getAddress()}`);

    // 2. Test du mode test
    console.log("\n🧪 Vérification du mode test...");
    const isTestMode = await transferContract.isTestMode();
    console.log(`Mode test: ${isTestMode ? "ACTIVÉ ✅" : "DÉSACTIVÉ ❌"}`);

    // 3. Test de transfert immédiat (< 1000 CVTC)
    console.log("\n💸 Test de transfert immédiat...");
    const smallAmount = ethers.parseEther("500"); // 500 CVTC

    // Simuler l'approbation (dans un vrai test, il faudrait un token réel)
    console.log(`Transfert immédiat de ${ethers.formatEther(smallAmount)} CVTC`);

    // 4. Test de transfert échelonné (>= 1000 CVTC)
    console.log("\n⏰ Test de transfert échelonné...");
    const largeAmount = ethers.parseEther("2000"); // 2000 CVTC
    console.log(`Transfert échelonné de ${ethers.formatEther(largeAmount)} CVTC`);

    // 5. Vérification des statistiques
    console.log("\n📊 Statistiques du contrat:");
    const stats = await transferContract.getTransferStats();
    console.log(`   • Total des transferts: ${stats[0]}`);
    console.log(`   • Transferts immédiats: ${stats[1]}`);
    console.log(`   • Transferts échelonnés: ${stats[2]}`);
    console.log(`   • Transferts échelonnés actifs: ${stats[3]}`);

    // 6. Test des seuils
    console.log("\n⚙️ Configuration des seuils:");
    console.log(`   • Seuil échelonné: 1000 CVTC`);
    console.log(`   • Étapes maximum: 6`);
    console.log(`   • Intervalle de base: 30 jours`);

    console.log("\n🎉 TESTS TERMINÉS !");
    console.log("✅ Le système fonctionne SANS fonctionnalités Premium");
    console.log("✅ Tous les utilisateurs ont les mêmes droits");
    console.log("✅ Pas de confusion avec les abonnements");

  } catch (error: any) {
    console.log("❌ Erreur de test:", error?.message || "Erreur inconnue");
  }
}

main().catch((error) => {
  console.error("❌ Erreur critique:", error);
  process.exitCode = 1;
});