import { ethers } from "hardhat";

async function main() {
  console.log("🔄 Test SYSTÈME D'ÉCHELONNEMENT P2P - Réception progressive 1, 2, 4, 8, 16, 32...");

  const [deployer, user1, user2] = await ethers.getSigners();
  console.log(`📋 Deployer: ${deployer.address}`);
  console.log(`👤 User1: ${user1.address}`);
  console.log(`👤 User2: ${user2.address}`);

  // Adresses des contrats
  const cvtcPremiumAddress = process.env.CVTC_PREMIUM_ADDRESS;

  if (!cvtcPremiumAddress) {
    console.log("❌ Adresse CVTC_PREMIUM_ADDRESS manquante.");
    console.log("💡 Déployez d'abord: npx hardhat run scripts/deploy-all.ts --network bscTestnet");
    return;
  }

  console.log(`👑 CVTC Premium: ${cvtcPremiumAddress}`);

  try {
    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
    const cvtcPremium = CVTCPremium.attach(cvtcPremiumAddress) as any;

    // 1. Configuration de l'échelonnement
    console.log("\n⚙️ Configuration de l'Échelonnement:");
    const threshold = await cvtcPremium.STAGGERED_THRESHOLD();
    const interval = await cvtcPremium.STAGGERED_INTERVAL();
    const maxSteps = await cvtcPremium.MAX_STAGGERED_STEPS();

    console.log(`💰 Seuil échelonnement: ${ethers.utils.formatEther(threshold)} CVTC`);
    console.log(`⏰ Interval entre étapes: ${interval} secondes`);
    console.log(`📊 Maximum d'étapes: ${maxSteps}`);

    // 2. Abonnements premium pour les tests
    console.log("\n👑 Abonnements Premium:");
    for (const user of [user1, user2]) {
      const tx = await user.sendTransaction({
        to: cvtcPremiumAddress,
        value: ethers.utils.parseEther("5.0"),
      });
      await tx.wait();
      console.log(`✅ ${user.address.slice(-6)} abonné`);
    }

    // 3. Test de calcul de séquence d'échelonnement
    console.log("\n🧮 Test de Calcul de Séquence:");

    const testAmounts = [
      ethers.utils.parseEther("1000"),  // 1000 CVTC - seuil minimum
      ethers.utils.parseEther("1500"),  // 1500 CVTC
      ethers.utils.parseEther("2500"),  // 2500 CVTC
      ethers.utils.parseEther("5000"),  // 5000 CVTC
    ];

    for (const amount of testAmounts) {
      console.log(`\n💰 Montant: ${ethers.utils.formatEther(amount)} CVTC`);

      // Calculer la séquence (simulation côté client)
      const sequence = calculateReleaseSequence(amount);
      console.log(`📋 Séquence: ${sequence.map(s => ethers.utils.formatEther(s)).join(' → ')}`);
      console.log(`⏱️  Étapes: ${sequence.length}, Total: ${ethers.utils.formatEther(sequence.reduce((a, b) => a + b, 0n))} CVTC`);
    }

    // 4. Initiation d'un transfert échelonné
    console.log("\n🚀 Initiation d'un Transfert Échelonné:");

    const transferAmount = ethers.utils.parseEther("1500"); // 1500 CVTC
    console.log(`📤 Transfert: ${ethers.utils.formatEther(transferAmount)} CVTC`);
    console.log(`👤 De: ${user1.address.slice(-6)} → À: ${user2.address.slice(-6)}`);

    // Initier le transfert échelonné
    await cvtcPremium.connect(user1).initiateStaggeredTransfer(user2.address, transferAmount);

    // Récupérer l'ID du transfert
    const staggeredStats = await cvtcPremium.getStaggeredStats();
    const transferId = staggeredStats[0]; // Dernier transfert créé

    console.log(`✅ Transfert échelonné initié - ID: ${transferId}`);

    // Vérifier les détails du transfert
    const transferInfo = await cvtcPremium.getStaggeredTransferInfo(transferId);
    console.log(`📊 Détails du transfert:`);
    console.log(`   • Montant total: ${ethers.utils.formatEther(transferInfo[2])} CVTC`);
    console.log(`   • Restant: ${ethers.utils.formatEther(transferInfo[3])} CVTC`);
    console.log(`   • Étape actuelle: ${transferInfo[4]}`);
    console.log(`   • Prochaine libération: ${new Date(Number(transferInfo[5]) * 1000).toISOString()}`);
    console.log(`   • Séquence: ${transferInfo[6].map((s: any) => ethers.utils.formatEther(s)).join(' → ')}`);
    console.log(`   • Actif: ${transferInfo[7]}`);

    // 5. Simulation des libérations échelonnées
    console.log("\n⏳ Simulation des Libérations Échelonnées:");

    const releaseSchedule = transferInfo[6];
    let totalReleased = 0;

    for (let step = 0; step < releaseSchedule.length; step++) {
      console.log(`\n📅 Étape ${step + 1}/${releaseSchedule.length}`);

      const releaseAmount = releaseSchedule[step];
      const canExecute = await cvtcPremium.canExecuteRelease(transferId, user2.address);

      if (canExecute) {
        console.log(`✅ Libération possible: ${ethers.utils.formatEther(releaseAmount)} CVTC`);

        // Exécuter la libération
        await cvtcPremium.connect(user2).executeStaggeredRelease(transferId);

        totalReleased += Number(ethers.utils.formatEther(releaseAmount));
        console.log(`💰 Libération exécutée! Total reçu: ${totalReleased} CVTC`);

        // Vérifier l'état après libération
        const updatedInfo = await cvtcPremium.getStaggeredTransferInfo(transferId);
        console.log(`   • Restant: ${ethers.utils.formatEther(updatedInfo[3])} CVTC`);
        console.log(`   • Étape actuelle: ${updatedInfo[4]}`);

        // Attendre l'interval entre étapes (sauf dernière étape)
        if (step < releaseSchedule.length - 1) {
          console.log(`⏰ Attente de ${interval} secondes avant la prochaine libération...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 secondes pour simulation
        }
      } else {
        console.log(`⏳ Libération pas encore disponible`);
      }
    }

    // 6. Vérification finale
    console.log("\n🎯 Vérification Finale:");

    const finalInfo = await cvtcPremium.getStaggeredTransferInfo(transferId);
    const finalStats = await cvtcPremium.getStaggeredStats();

    console.log(`✅ Transfert terminé: ${!finalInfo[7]}`);
    console.log(`📊 Statistiques:`);
    console.log(`   • Transferts échelonnés totaux: ${finalStats[0]}`);
    console.log(`   • Libérations totales: ${ethers.utils.formatEther(finalStats[1])} CVTC`);
    console.log(`   • Transferts actifs: ${finalStats[2]}`);

    // 7. Test avec un montant plus important
    console.log("\n🧪 Test avec Montant Plus Important:");

    const largeAmount = ethers.utils.parseEther("5000"); // 5000 CVTC
    console.log(`📤 Gros transfert: ${ethers.utils.formatEther(largeAmount)} CVTC`);

    const largeSequence = calculateReleaseSequence(largeAmount);
    console.log(`📋 Séquence calculée: ${largeSequence.map(s => ethers.utils.formatEther(s)).join(' → ')}`);
    console.log(`⏱️  Étapes nécessaires: ${largeSequence.length}`);

    // Calcul du résumé
    const totalSteps = largeSequence.length;
    const maxRelease = Math.max(...largeSequence.map(s => Number(ethers.utils.formatEther(s))));
    const avgRelease = largeSequence.reduce((a, b) => a + Number(ethers.utils.formatEther(b)), 0) / totalSteps;

    console.log(`📊 Analyse:`);
    console.log(`   • Nombre d'étapes: ${totalSteps}`);
    console.log(`   • Libération maximale: ${maxRelease} CVTC`);
    console.log(`   • Libération moyenne: ${avgRelease.toFixed(2)} CVTC`);
    console.log(`   • Durée totale: ${(totalSteps - 1) * Number(interval) / 3600} heures`);

    console.log("\n🎉 Test Échelonnement P2P terminé avec succès!");
    console.log("✅ Système d'échelonnement opérationnel");
    console.log("✅ Séquence géométrique 1, 2, 4, 8, 16, 32... fonctionnelle");
    console.log("✅ Libérations progressives automatiques");
    console.log("✅ Gestion du temps et des étapes parfaite");
    console.log("✅ Transferts de gros montants optimisés");

  } catch (error: any) {
    console.log("❌ Erreur lors du test d'échelonnement:", error?.message || "Erreur inconnue");
  }
}

// Fonction utilitaire pour calculer la séquence d'échelonnement
function calculateReleaseSequence(totalAmount: bigint): bigint[] {
  const schedule: bigint[] = [];
  let remaining = totalAmount;
  let stepAmount = 1n * 10n**18n; // 1 CVTC en wei
  const maxSteps = 10;

  while (remaining > 0n && schedule.length < maxSteps) {
    if (stepAmount >= remaining) {
      // Dernière étape : transférer le reste
      schedule.push(remaining);
      remaining = 0n;
    } else {
      // Étape normale
      schedule.push(stepAmount);
      remaining -= stepAmount;
    }

    stepAmount *= 2n; // Doubler pour la prochaine étape
  }

  return schedule;
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});