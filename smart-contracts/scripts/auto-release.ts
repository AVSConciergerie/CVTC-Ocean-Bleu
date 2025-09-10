import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Démarrage du système de libération automatique des CVTC...");

  // Adresse du contrat déployé
  const contractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83"; // Nouveau contrat premium

  // Obtenir le contrat
  const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
  const contract = CVTCPremium.attach(contractAddress);

  console.log(`📋 Contrat connecté: ${contractAddress}`);

  // Obtenir les statistiques actuelles
  const stats = await contract.getStaggeredStats();
  console.log(`📊 Statistiques actuelles:`);
  console.log(`   - Transferts échelonnés totaux: ${stats[0]}`);
  console.log(`   - Libérations totales: ${stats[1]}`);
  console.log(`   - Transferts actifs: ${stats[2]}`);

  if (stats[2] === 0) {
    console.log("✅ Aucun transfert actif à traiter");
    return;
  }

  console.log(`🔄 Traitement de ${stats[2]} transferts actifs...`);

  let processedCount = 0;
  let totalReleased = 0;

  // Parcourir tous les transferts possibles (jusqu'à 1000 pour éviter les timeouts)
  for (let i = 1; i <= Math.min(1000, stats[0]); i++) {
    try {
      // Vérifier si le transfert peut être exécuté
      const canExecute = await contract.canExecuteRelease(i, ethers.ZeroAddress);

      if (canExecute) {
        console.log(`⚡ Exécution de la release pour le transfert ${i}...`);

        // Exécuter la release
        const tx = await contract.executeStaggeredRelease(i);
        await tx.wait();

        // Obtenir les détails de la release
        const transferInfo = await contract.getStaggeredTransferInfo(i);
        const releaseAmount = transferInfo[6][transferInfo[5] - 1]; // releaseSchedule[currentStep-1]

        console.log(`✅ Release exécutée: ${ethers.formatEther(releaseAmount)} CVTC`);
        processedCount++;
        totalReleased += Number(releaseAmount);
      }
    } catch (error) {
      // Ignorer les erreurs (transfert inexistant ou déjà traité)
      continue;
    }
  }

  console.log(`\n🎉 Traitement terminé !`);
  console.log(`📈 Releases exécutées: ${processedCount}`);
  console.log(`💰 Total libéré: ${ethers.formatEther(totalReleased)} CVTC`);

  // Statistiques finales
  const finalStats = await contract.getStaggeredStats();
  console.log(`📊 Statistiques finales:`);
  console.log(`   - Transferts actifs restants: ${finalStats[2]}`);
  console.log(`   - Libérations totales: ${finalStats[1]}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur lors de l'exécution:", error);
    process.exit(1);
  });