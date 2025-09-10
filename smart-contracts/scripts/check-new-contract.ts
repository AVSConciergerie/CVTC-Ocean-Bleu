import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Vérification du nouveau contrat CVTCPremium");

  try {
    // Adresse du nouveau contrat déployé
    const contractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83";

    // Se connecter au contrat
    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
    const contract = CVTCPremium.attach(contractAddress);

    // Vérifier le mode test
    const isTestMode = await contract.isTestMode();
    console.log(`📊 Mode test activé: ${isTestMode}`);

    // Vérifier les statistiques
    const stats = await contract.getStaggeredStats();
    console.log(`📈 Statistiques:`);
    console.log(`   - Transferts échelonnés totaux: ${stats[0]}`);
    console.log(`   - Libérations totales: ${stats[1]}`);
    console.log(`   - Transferts actifs: ${stats[2]}`);

    if (stats[0] > 0) {
      console.log("\n🔍 Transferts dans le nouveau contrat:");

      for (let i = 1; i <= stats[0]; i++) {
        try {
          const transfer = await contract.getStaggeredTransferInfo(i);
          if (transfer[7]) { // isActive
            console.log(`\n📋 Transfert ID ${i}:`);
            console.log(`   - Expéditeur: ${transfer[0]}`);
            console.log(`   - Destinataire: ${transfer[1]}`);
            console.log(`   - Montant total: ${ethers.formatUnits(transfer[2], 2)} CVTC`);
            console.log(`   - Restant: ${ethers.formatUnits(transfer[3], 2)} CVTC`);
            console.log(`   - Étape actuelle: ${transfer[4]}`);
            console.log(`   - Prochaine libération: ${new Date(Number(transfer[5]) * 1000).toLocaleString()}`);
            console.log(`   - Séquence: [${transfer[6].map((s: bigint) => ethers.formatUnits(s, 2)).join(', ')}]`);

            // Vérifier si le destinataire peut réclamer
            const canExecute = await contract.canExecuteRelease(i, transfer[1]);
            console.log(`   - Peut réclamer maintenant: ${canExecute}`);
          }
        } catch (error) {
          console.log(`   ❌ Erreur pour transfert ${i}:`, error.message);
        }
      }
    } else {
      console.log("ℹ️ Aucun transfert dans le nouveau contrat.");
      console.log("💡 Le transfert précédent était sur l'ancien contrat.");
      console.log("🔄 Il faudrait refaire le transfert avec le nouveau contrat pour tester l'automatisation.");
    }

  } catch (error: any) {
    console.log("❌ Erreur:", error?.message || "Erreur inconnue");
  }
}

main().catch((error) => {
  console.error("❌ Erreur critique:", error);
  process.exitCode = 1;
});