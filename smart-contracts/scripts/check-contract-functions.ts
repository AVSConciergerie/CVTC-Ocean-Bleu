import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Vérification des fonctions disponibles dans l'ancien contrat");

  try {
    const oldContractAddress = "0x36FBc44E789e41F8383f11312e496aDc922CEEDa";

    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
    const oldContract = CVTCPremium.attach(oldContractAddress);

    console.log("📋 Test des fonctions disponibles...");

    // Tester différentes fonctions
    try {
      const owner = await oldContract.owner();
      console.log(`✅ owner(): ${owner}`);
    } catch (error) {
      console.log(`❌ owner(): ${error.message}`);
    }

    try {
      const isTestMode = await oldContract.isTestMode();
      console.log(`✅ isTestMode(): ${isTestMode}`);
    } catch (error) {
      console.log(`❌ isTestMode(): ${error.message}`);
    }

    try {
      const stats = await oldContract.getStaggeredStats();
      console.log(`✅ getStaggeredStats(): [${stats.join(', ')}]`);
    } catch (error) {
      console.log(`❌ getStaggeredStats(): ${error.message}`);
    }

    try {
      const transfer = await oldContract.getStaggeredTransferInfo(1);
      console.log(`✅ getStaggeredTransferInfo(1): OK`);
    } catch (error) {
      console.log(`❌ getStaggeredTransferInfo(1): ${error.message}`);
    }

    try {
      const canExecute = await oldContract.canExecuteRelease(1, "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389");
      console.log(`✅ canExecuteRelease(): ${canExecute}`);
    } catch (error) {
      console.log(`❌ canExecuteRelease(): ${error.message}`);
    }

    try {
      await oldContract.emergencyRelease(1);
      console.log(`✅ emergencyRelease(): Disponible`);
    } catch (error) {
      console.log(`❌ emergencyRelease(): ${error.message}`);
    }

    try {
      await oldContract.processPendingReleases();
      console.log(`✅ processPendingReleases(): Disponible`);
    } catch (error) {
      console.log(`❌ processPendingReleases(): ${error.message}`);
    }

  } catch (error: any) {
    console.log("❌ Erreur générale:", error?.message || "Erreur inconnue");
  }
}

main().catch((error) => {
  console.error("❌ Erreur critique:", error);
  process.exitCode = 1;
});