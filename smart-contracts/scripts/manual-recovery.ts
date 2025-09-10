import { ethers } from "hardhat";

async function main() {
  console.log("🔧 Récupération manuelle des fonds - Ancien système");

  try {
    // Ancien contrat
    const oldContractAddress = "0x36FBc44E789e41F8383f11312e496aDc922CEEDa";
    const receiverAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";

    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
    const oldContract = CVTCPremium.attach(oldContractAddress);

    console.log("📋 Vérification de l'état du transfert...");

    // Vérifier si le destinataire peut réclamer
    const canExecute = await oldContract.canExecuteRelease(1, receiverAddress);
    console.log(`🔍 Peut réclamer maintenant: ${canExecute}`);

    if (canExecute) {
      console.log("🚀 Réclamation de la première tranche...");

      // Créer un signer pour le destinataire (simulation)
      const [deployer] = await ethers.getSigners();

      // Se connecter au contrat avec le deployer (pour simulation)
      const contractAsReceiver = oldContract.connect(deployer);

      // Réclamer la libération
      const tx = await contractAsReceiver.executeStaggeredRelease(1);
      const receipt = await tx.wait();

      console.log("✅ Réclamation réussie !");
      console.log(`📋 Hash: ${receipt.hash}`);

      // Vérifier le nouveau statut
      const transferAfter = await oldContract.getStaggeredTransferInfo(1);
      console.log(`\n📊 Nouveau statut:`);
      console.log(`   - Étape actuelle: ${transferAfter[4]}`);
      console.log(`   - Restant: ${ethers.formatUnits(transferAfter[3], 2)} CVTC`);
      console.log(`   - Prochaine libération: ${new Date(Number(transferAfter[5]) * 1000).toLocaleString()}`);

      // Vérifier le solde du destinataire
      const cvtcToken = await ethers.getContractAt("IERC20", "0x532FC49071656C16311F2f89E6e41C53243355D3");
      const balance = await cvtcToken.balanceOf(receiverAddress);
      console.log(`💰 Solde du destinataire: ${ethers.formatUnits(balance, 2)} CVTC`);

    } else {
      console.log("⏳ Pas encore temps de réclamer les fonds.");
      console.log("💡 En mode test, attendez 15 secondes ou forcez la récupération.");
    }

  } catch (error: any) {
    console.log("❌ Erreur:", error?.message || "Erreur inconnue");
  }
}

main().catch((error) => {
  console.error("❌ Erreur critique:", error);
  process.exitCode = 1;
});