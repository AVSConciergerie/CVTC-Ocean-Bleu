import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Vérification du mode test du contrat CVTCPremium");

  try {
    // Adresse du contrat déployé
    const contractAddress = "0x36FBc44E789e41F8383f11312e496aDc922CEEDa";

    // Se connecter au contrat
    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
    const contract = CVTCPremium.attach(contractAddress);

    // Vérifier le mode test
    const isTestMode = await contract.isTestMode();
    console.log(`📊 Mode test activé: ${isTestMode}`);

    if (isTestMode) {
      console.log("✅ Le mode test est activé - Intervalles de 15 secondes");
    } else {
      console.log("❌ Le mode test n'est pas activé - Intervalles de 30 jours");
      console.log("🔄 Activation du mode test...");

      // Activer le mode test
      const tx = await contract.toggleTestMode();
      await tx.wait();

      const newTestMode = await contract.isTestMode();
      console.log(`📊 Nouveau mode test: ${newTestMode}`);
    }

    // Vérifier les transferts échelonnés actifs
    const stats = await contract.getStaggeredStats();
    console.log(`📈 Statistiques:`);
    console.log(`   - Transferts échelonnés totaux: ${stats[0]}`);
    console.log(`   - Libérations totales: ${stats[1]}`);
    console.log(`   - Transferts actifs: ${stats[2]}`);

    if (stats[2] > 0) {
      console.log("\n🔍 Détails des transferts actifs:");

      // Chercher les transferts actifs (cette partie est simplifiée)
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
            console.log(`   - Étapes totales: ${transfer[6].length}`);
            console.log(`   - Séquence: [${transfer[6].map((s: bigint) => ethers.formatUnits(s, 2)).join(', ')}]`);

            // Vérifier si le destinataire peut réclamer
            const canExecute = await contract.canExecuteRelease(i, transfer[1]);
            console.log(`   - Peut réclamer maintenant: ${canExecute}`);
          }
        } catch (error) {
          // Transfert peut ne pas exister
        }
      }
    }

  } catch (error: any) {
    console.log("❌ Erreur:", error?.message || "Erreur inconnue");
  }
}

main().catch((error) => {
  console.error("❌ Erreur critique:", error);
  process.exitCode = 1;
});