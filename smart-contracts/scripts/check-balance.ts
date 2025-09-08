import { ethers } from "hardhat";
import { parseEther, formatEther } from "ethers/lib/utils";

async function main() {
  console.log("💰 Vérification du solde BNB...");

  const [deployer] = await ethers.getSigners();
  console.log(`📋 Adresse vérifiée: ${deployer.address}`);

  try {
    const balance = await ethers.provider.getBalance(deployer.address);
    const balanceInBNB = formatEther(balance);

    console.log(`💰 Solde actuel: ${balanceInBNB} BNB`);

    // Vérifications recommandées
    const minBalance = parseEther("0.1"); // 0.1 BNB minimum
    const recommendedBalance = parseEther("1.0"); // 1 BNB recommandé

    if (balance < minBalance) {
      console.log("❌ Solde insuffisant pour les tests (< 0.1 BNB)");
      console.log("💡 Obtenez des BNB test sur: https://testnet.binance.org/faucet-smart");
    } else if (balance < recommendedBalance) {
      console.log("⚠️ Solde faible (< 1 BNB) - Risque d'échec des transactions");
      console.log("💡 Recommandé: Au moins 1 BNB pour les tests complets");
    } else {
      console.log("✅ Solde suffisant pour tous les tests");
    }

    // Estimation des coûts
    console.log("\n📊 Estimation des coûts de test:");
    console.log("   • Déploiement contrats: ~0.05 BNB");
    console.log("   • Abonnement premium: 5 BNB (test)");
    console.log("   • Transactions diverses: ~0.01 BNB");
    console.log(`   • Total estimé: ~5.07 BNB`);

  } catch (error: any) {
    console.log("❌ Erreur lors de la vérification:", error?.message || "Erreur inconnue");
  }
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});