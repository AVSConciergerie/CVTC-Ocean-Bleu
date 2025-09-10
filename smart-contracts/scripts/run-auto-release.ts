import { ethers } from "hardhat";

async function main() {
  console.log("🔄 Exécution du traitement automatique des libérations...");

  try {
    // Adresse du nouveau contrat déployé
    const contractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83";

    // Se connecter au contrat
    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
    const contract = CVTCPremium.attach(contractAddress);

    console.log("🚀 Déclenchement du traitement automatique...");

    // Appeler la fonction de traitement automatique
    const tx = await contract.processPendingReleases();
    const receipt = await tx.wait();

    console.log("✅ Traitement automatique exécuté !");
    console.log(`📋 Transaction: ${receipt.hash}`);

    // Analyser les événements
    const processedEvents = receipt.logs.filter(log => {
      try {
        return contract.interface.parseLog(log).name === "PendingReleasesProcessed";
      } catch {
        return false;
      }
    });

    if (processedEvents.length > 0) {
      const decodedEvent = contract.interface.parseLog(processedEvents[0]);
      console.log(`🎉 ${decodedEvent.args.processedCount} libération(s) traitée(s) !`);

      // Afficher les détails des libérations
      const releaseEvents = receipt.logs.filter(log => {
        try {
          return contract.interface.parseLog(log).name === "StaggeredReleaseExecuted";
        } catch {
          return false;
        }
      });

      releaseEvents.forEach((log, index) => {
        const event = contract.interface.parseLog(log);
        console.log(`   📦 Libération ${index + 1}: ${ethers.formatUnits(event.args.amount, 2)} CVTC → ${event.args.receiver}`);
      });
    } else {
      console.log("ℹ️ Aucune libération en attente.");
    }

  } catch (error: any) {
    console.log("❌ Erreur:", error?.message || "Erreur inconnue");
  }
}

main().catch((error) => {
  console.error("❌ Erreur critique:", error);
  process.exitCode = 1;
});