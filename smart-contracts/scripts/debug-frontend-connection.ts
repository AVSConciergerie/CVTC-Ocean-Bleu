import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Debug de la connexion frontend");

  try {
    const oldContractAddress = "0x36FBc44E789e41F8383f11312e496aDc922CEEDa";
    const receiverAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";

    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
    const oldContract = CVTCPremium.attach(oldContractAddress);

    console.log("📋 Simulation de ce que voit le frontend...");

    // Simuler la fonction getUserStaggeredTransfers pour le destinataire
    console.log(`\n🔍 Test pour l'adresse destinataire: ${receiverAddress}`);
    const userTransfers = await oldContract.getUserStaggeredTransfers(receiverAddress);
    console.log(`📊 Transferts trouvés: [${userTransfers.join(', ')}]`);

    if (userTransfers.length > 0) {
      console.log("✅ Le destinataire a des transferts !");

      for (const transferId of userTransfers) {
        const details = await oldContract.getStaggeredTransferInfo(transferId);
        console.log(`\n📋 Transfert ID ${transferId}:`);
        console.log(`   - Expéditeur: ${details[0]}`);
        console.log(`   - Destinataire: ${details[1]}`);
        console.log(`   - Montant total: ${ethers.formatUnits(details[2], 2)} CVTC`);
        console.log(`   - Actif: ${details[7]}`);
      }
    } else {
      console.log("❌ Aucun transfert trouvé pour cette adresse");
      console.log("💡 Vérifiez que vous êtes connecté avec la bonne adresse");
    }

    // Tester avec d'autres adresses possibles
    console.log(`\n🔍 Test avec d'autres adresses possibles...`);

    // Adresse de l'expéditeur
    const senderAddress = "0x71438578893865F0664EdC067B10263c2CF92a1b";
    const senderTransfers = await oldContract.getUserStaggeredTransfers(senderAddress);
    console.log(`📊 Transferts de l'expéditeur (${senderAddress}): [${senderTransfers.join(', ')}]`);

    console.log("\n💡 SOLUTION:");
    console.log("1. Assurez-vous d'être connecté avec l'adresse destinataire:");
    console.log(`   ${receiverAddress}`);
    console.log("2. Si ce n'est pas le cas, changez de wallet dans Metamask");
    console.log("3. Actualisez la page frontend");
    console.log("4. Vous devriez voir le transfert dans 'Mes Réclamations de Fonds'");

  } catch (error: any) {
    console.log("❌ Erreur:", error?.message || "Erreur inconnue");
  }
}

main().catch((error) => {
  console.error("❌ Erreur critique:", error);
  process.exitCode = 1;
});