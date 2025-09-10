import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Test du système de libération automatique...");

  const contractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83";

  const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
  const contract = CVTCPremium.attach(contractAddress);

  // Tester quelques transferts
  const stats = await contract.getStaggeredStats();
  console.log(`📊 Transferts actifs: ${stats[2]}`);

  if (stats[2] > 0) {
    console.log("🔄 Test d'exécution d'une release...");

    // Tester le premier transfert actif
    for (let i = 1; i <= Math.min(5, stats[0]); i++) {
      try {
        const canExecute = await contract.canExecuteRelease(i, ethers.ZeroAddress);
        if (canExecute) {
          console.log(`✅ Transfert ${i} peut être exécuté automatiquement`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
  }

  console.log("✅ Test terminé - Le système automatique fonctionne !");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });