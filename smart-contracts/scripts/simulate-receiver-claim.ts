import { ethers } from "hardhat";

async function main() {
  console.log("🎭 Simulation de la réclamation par le destinataire");

  try {
    const oldContractAddress = "0x36FBc44E789e41F8383f11312e496aDc922CEEDa";
    const receiverAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";

    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
    const oldContract = CVTCPremium.attach(oldContractAddress);

    console.log("📋 Simulation de la réclamation...");

    // Vérifier que la réclamation est possible
    const canExecute = await oldContract.canExecuteRelease(1, receiverAddress);
    console.log(`🔍 Peut réclamer: ${canExecute}`);

    if (canExecute) {
      console.log("🚀 Simulation de la réclamation...");

      // Pour la simulation, on va impersonner le destinataire
      // En production, le destinataire utiliserait son propre wallet
      const receiverSigner = await ethers.getImpersonatedSigner(receiverAddress);

      // Se connecter au contrat avec le destinataire
      const contractAsReceiver = oldContract.connect(receiverSigner);

      // Réclamer la libération
      const tx = await contractAsReceiver.executeStaggeredRelease(1);
      const receipt = await tx.wait();

      console.log("✅ Réclamation simulée réussie !");
      console.log(`📋 Transaction: ${receipt.hash}`);

      // Vérifier le résultat
      const transferAfter = await oldContract.getStaggeredTransferInfo(1);
      console.log(`\n📊 État après réclamation:`);
      console.log(`   - Étape actuelle: ${transferAfter[4]}`);
      console.log(`   - Restant: ${ethers.formatUnits(transferAfter[3], 2)} CVTC`);

      // Vérifier le solde du destinataire
      const cvtcToken = await ethers.getContractAt("IERC20", "0x532FC49071656C16311F2f89E6e41C53243355D3");
      const balance = await cvtcToken.balanceOf(receiverAddress);
      console.log(`💰 Solde du destinataire: ${ethers.formatUnits(balance, 2)} CVTC`);

      console.log("\n🎉 La première tranche (1 CVTC) a été transférée au destinataire !");

    } else {
      console.log("⏳ Pas encore temps de réclamer.");
    }

  } catch (error: any) {
    console.log("❌ Erreur:", error?.message || "Erreur inconnue");
  }
}

main().catch((error) => {
  console.error("❌ Erreur critique:", error);
  process.exitCode = 1;
});