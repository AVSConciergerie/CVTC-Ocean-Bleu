import { ethers } from "hardhat";

async function main() {
  console.log("🎁 Réclamation des fonds échelonnés");

  try {
    // Adresse du contrat déployé
    const contractAddress = "0x36FBc44E789e41F8383f11312e496aDc922CEEDa";

    // Adresse du destinataire (celle qui peut réclamer)
    const recipientAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";

    // Se connecter au contrat
    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
    const contract = CVTCPremium.attach(contractAddress);

    // Vérifier si le destinataire peut réclamer
    const canExecute = await contract.canExecuteRelease(1, recipientAddress);
    console.log(`🔍 Peut réclamer: ${canExecute}`);

    if (canExecute) {
      console.log("🚀 Réclamation de la première tranche...");

      // Créer un signer pour le destinataire
      const [deployer] = await ethers.getSigners();

      // Pour simuler, on utilise le deployer comme destinataire
      // En production, le destinataire utiliserait son propre wallet
      const recipientSigner = await ethers.getImpersonatedSigner(recipientAddress);

      // Se connecter au contrat avec le destinataire
      const contractAsRecipient = contract.connect(recipientSigner);

      // Réclamer la libération
      const tx = await contractAsRecipient.executeStaggeredRelease(1);
      const receipt = await tx.wait();

      console.log("✅ Réclamation réussie !");
      console.log(`📋 Hash de transaction: ${receipt.hash}`);

      // Vérifier le nouveau statut
      const transferAfter = await contract.getStaggeredTransferInfo(1);
      console.log(`\n📊 Nouveau statut:`);
      console.log(`   - Étape actuelle: ${transferAfter[4]}`);
      console.log(`   - Restant: ${ethers.formatUnits(transferAfter[3], 2)} CVTC`);
      console.log(`   - Prochaine libération: ${new Date(Number(transferAfter[5]) * 1000).toLocaleString()}`);

      // Vérifier le solde du destinataire
      const cvtcToken = await ethers.getContractAt("IERC20", "0x532FC49071656C16311F2f89E6e41C53243355D3");
      const balance = await cvtcToken.balanceOf(recipientAddress);
      console.log(`💰 Solde CVTC du destinataire: ${ethers.formatUnits(balance, 2)} CVTC`);

    } else {
      console.log("⏳ Pas encore temps de réclamer les fonds");
    }

  } catch (error: any) {
    console.log("❌ Erreur:", error?.message || "Erreur inconnue");
  }
}

main().catch((error) => {
  console.error("❌ Erreur critique:", error);
  process.exitCode = 1;
});