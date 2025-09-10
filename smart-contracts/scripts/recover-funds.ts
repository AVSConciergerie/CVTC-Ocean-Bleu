import { ethers } from "hardhat";

async function main() {
  console.log("🔄 Récupération des fonds de l'ancien contrat");

  try {
    // Ancien contrat
    const oldContractAddress = "0x36FBc44E789e41F8383f11312e496aDc922CEEDa";

    // Adresses impliquées
    const senderAddress = "0x71438578893865F0664EdC067B10263c2CF92a1b";
    const receiverAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";

    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
    const oldContract = CVTCPremium.attach(oldContractAddress);

    console.log("📋 Tentative de récupération des fonds...");

    // Essayer de déclencher les libérations dues
    console.log("🚀 Déclenchement des libérations en attente...");
    const tx = await oldContract.processPendingReleases();
    const receipt = await tx.wait();

    console.log("✅ Libérations traitées !");
    console.log(`📋 Transaction: ${receipt.hash}`);

    // Vérifier les événements de libération
    const releaseEvents = receipt.logs.filter(log => {
      try {
        return oldContract.interface.parseLog(log).name === "StaggeredReleaseExecuted";
      } catch {
        return false;
      }
    });

    if (releaseEvents.length > 0) {
      console.log(`🎉 ${releaseEvents.length} libération(s) exécutée(s) !`);

      releaseEvents.forEach((log, index) => {
        const event = oldContract.interface.parseLog(log);
        console.log(`   📦 Libération ${index + 1}: ${ethers.formatUnits(event.args.amount, 2)} CVTC → ${event.args.receiver}`);
      });
    } else {
      console.log("ℹ️ Aucune libération n'était due pour le moment.");
    }

    // Vérifier l'état après récupération
    const transferAfter = await oldContract.getStaggeredTransferInfo(1);
    console.log(`\n📊 État après récupération:`);
    console.log(`   - Restant: ${ethers.formatUnits(transferAfter[3], 2)} CVTC`);
    console.log(`   - Étape actuelle: ${transferAfter[4]}`);
    console.log(`   - Actif: ${transferAfter[7]}`);

    // Vérifier le solde du destinataire
    const cvtcToken = await ethers.getContractAt("IERC20", "0x532FC49071656C16311F2f89E6e41C53243355D3");
    const receiverBalance = await cvtcToken.balanceOf(receiverAddress);
    console.log(`💰 Solde du destinataire: ${ethers.formatUnits(receiverBalance, 2)} CVTC`);

  } catch (error: any) {
    console.log("❌ Erreur:", error?.message || "Erreur inconnue");
  }
}

main().catch((error) => {
  console.error("❌ Erreur critique:", error);
  process.exitCode = 1;
});