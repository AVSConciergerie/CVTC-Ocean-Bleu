import { ethers } from "hardhat";

async function main() {
  console.log("🚨 RÉCUPÉRATION D'URGENCE - Transfert des fonds au destinataire");

  try {
    // Ancien contrat où les fonds sont bloqués
    const oldContractAddress = "0x36FBc44E789e41F8383f11312e496aDc922CEEDa";
    const receiverAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";

    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
    const oldContract = CVTCPremium.attach(oldContractAddress);

    console.log("📋 Vérification de l'état du transfert avant récupération...");

    // Vérifier l'état actuel
    const transferBefore = await oldContract.getStaggeredTransferInfo(1);
    console.log(`   - Montant total: ${ethers.formatUnits(transferBefore[2], 2)} CVTC`);
    console.log(`   - Restant: ${ethers.formatUnits(transferBefore[3], 2)} CVTC`);
    console.log(`   - Actif: ${transferBefore[7]}`);

    if (transferBefore[7] && transferBefore[3] > 0) { // isActive et remaining > 0
      console.log("🚨 Déclenchement de la récupération d'urgence...");

      // Récupération d'urgence - transférer tout le restant au destinataire
      const tx = await oldContract.emergencyRelease(1);
      const receipt = await tx.wait();

      console.log("✅ Récupération d'urgence réussie !");
      console.log(`📋 Transaction: ${receipt.hash}`);

      // Vérifier l'état après récupération
      const transferAfter = await oldContract.getStaggeredTransferInfo(1);
      console.log(`\n📊 État après récupération:`);
      console.log(`   - Restant: ${ethers.formatUnits(transferAfter[3], 2)} CVTC`);
      console.log(`   - Actif: ${transferAfter[7]}`);

      // Vérifier le solde du destinataire
      const cvtcToken = await ethers.getContractAt("IERC20", "0x532FC49071656C16311F2f89E6e41C53243355D3");
      const receiverBalance = await cvtcToken.balanceOf(receiverAddress);
      console.log(`💰 Nouveau solde du destinataire: ${ethers.formatUnits(receiverBalance, 2)} CVTC`);

      console.log("\n🎉 Les fonds ont été transférés au destinataire !");
      console.log("💡 Le destinataire peut maintenant utiliser ses CVTC normalement.");

    } else {
      console.log("ℹ️ Le transfert n'est pas actif ou il n'y a pas de fonds à récupérer.");
    }

  } catch (error: any) {
    console.log("❌ Erreur:", error?.message || "Erreur inconnue");
  }
}

main().catch((error) => {
  console.error("❌ Erreur critique:", error);
  process.exitCode = 1;
});