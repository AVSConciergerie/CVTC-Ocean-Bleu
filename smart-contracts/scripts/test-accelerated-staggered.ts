import { ethers } from "hardhat";

async function main() {
  console.log("⚡ TEST ACCÉLÉRÉ - 15 SECONDES = 1 MOIS");
  console.log("=".repeat(60));

  const [deployer, sender, receiver] = await ethers.getSigners();
  console.log(`📤 Sender: ${sender.address.slice(-6)}`);
  console.log(`📥 Receiver: ${receiver.address.slice(-6)}`);

  // Adresses des contrats
  const cvtcPremiumAddress = process.env.CVTC_PREMIUM_ADDRESS;

  if (!cvtcPremiumAddress) {
    console.log("❌ CVTC_PREMIUM_ADDRESS manquante");
    console.log("💡 Déployez d'abord: npx hardhat run scripts/deploy-all.ts --network bscTestnet");
    return;
  }

  try {
    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
    const cvtcPremium = CVTCPremium.attach(cvtcPremiumAddress) as any;

    // Vérifier le mode test
    const isTestMode = await cvtcPremium.isTestMode();
    console.log(`🧪 Mode test: ${isTestMode ? "ACTIVÉ ✅" : "DÉSACTIVÉ ❌"}`);

    if (!isTestMode) {
      console.log("⚠️  Le mode test n'est pas activé. Activation...");
      await cvtcPremium.connect(deployer).toggleTestMode();
      console.log("✅ Mode test activé");
    }

    // Abonnements premium
    console.log("\n👑 Abonnements premium...");
    await sender.sendTransaction({ to: cvtcPremiumAddress, value: ethers.utils.parseEther("5.0") });
    await receiver.sendTransaction({ to: cvtcPremiumAddress, value: ethers.utils.parseEther("5.0") });
    console.log("✅ Abonnements OK");

    // Test accéléré avec 1500 CVTC
    const transferAmount = ethers.utils.parseEther("1500");
    console.log(`\n💰 Transfert accéléré: ${ethers.utils.formatEther(transferAmount)} CVTC`);
    console.log(`⏱️  Calendrier accéléré: 15s = 1 mois`);

    // Calcul de la séquence
    const sequence = calculateStaggeredSequence(transferAmount);
    console.log(`\n📊 Séquence accélérée:`);
    for (let i = 0; i < sequence.length; i++) {
      const months = i + 1;
      const seconds = months * 15; // 15 secondes = 1 mois
      console.log(`   Mois ${months}: ${ethers.utils.formatEther(sequence[i])} CVTC (dans ${seconds}s)`);
    }

    // Initiation du transfert
    console.log(`\n🚀 Initiation du transfert accéléré...`);
    await cvtcPremium.connect(sender).initiateStaggeredTransfer(receiver.address, transferAmount);

    const stats = await cvtcPremium.getStaggeredStats();
    const transferId = stats[0];
    console.log(`✅ Transfert accéléré initié - ID: ${transferId}`);

    // Simulation accélérée des libérations
    console.log(`\n🎬 SIMULATION ACCÉLÉRÉE DES LIBÉRATIONS`);
    console.log(`⏱️  Chaque étape prend 15 secondes (au lieu de 1 mois)`);

    let totalReceived = 0;
    const transferInfo = await cvtcPremium.getStaggeredTransferInfo(transferId);
    const releaseSchedule = transferInfo[6];

    for (let step = 0; step < releaseSchedule.length; step++) {
      console.log(`\n🎯 ÉTAPE ${step + 1}/${releaseSchedule.length} (ACCÉLÉRÉE)`);

      const months = step + 1;
      const seconds = months * 15;
      const releaseAmount = releaseSchedule[step];

      console.log(`💰 Montant: ${ethers.utils.formatEther(releaseAmount)} CVTC`);
      console.log(`⏱️  Délai simulé: ${seconds} secondes (au lieu de ${months} mois)`);

      // Attente accélérée de 15 secondes
      console.log(`⏳ Attente accélérée de 15 secondes...`);
      await new Promise(resolve => setTimeout(resolve, 15000)); // 15 secondes

      // Exécuter la libération
      await cvtcPremium.connect(receiver).executeStaggeredRelease(transferId);

      totalReceived += Number(ethers.utils.formatEther(releaseAmount));
      console.log(`✅ Libération exécutée!`);
      console.log(`📈 Total reçu: ${totalReceived} CVTC`);

      // Prochaine étape
      if (step < releaseSchedule.length - 1) {
        const nextSeconds = (step + 2) * 15;
        console.log(`➡️  Prochaine libération dans ${nextSeconds} secondes`);
      }
    }

    console.log(`\n🎉 TEST ACCÉLÉRÉ TERMINÉ AVEC SUCCÈS !`);
    console.log("=".repeat(60));
    console.log(`✅ Total transféré: ${totalReceived} CVTC`);
    console.log(`⚡ Durée réelle du test: ${(sequence.length * 15)} secondes`);
    console.log(`📅 Durée simulée: ${sequence.length} mois`);
    console.log(`🚀 Accélération: ${sequence.length * 30 * 24 * 3600 / (sequence.length * 15)}x plus rapide !`);

    // Statistiques finales
    const finalStats = await cvtcPremium.getStaggeredStats();
    console.log(`\n📊 Statistiques:`);
    console.log(`   • Transferts échelonnés: ${finalStats[0]}`);
    console.log(`   • Libérations totales: ${ethers.utils.formatEther(finalStats[1])} CVTC`);
    console.log(`   • Transferts actifs: ${finalStats[2]}`);

  } catch (error: any) {
    console.log("❌ Erreur:", error?.message || "Erreur inconnue");
  }
}

// Fonction utilitaire pour calculer la séquence d'échelonnement géométrique
function calculateStaggeredSequence(totalAmount: bigint): bigint[] {
  const sequence: bigint[] = [];
  let remaining = totalAmount;
  let stepAmount = 1n * 10n**18n; // 1 CVTC
  const maxSteps = 10;

  while (remaining > 0n && sequence.length < maxSteps) {
    if (stepAmount >= remaining) {
      // Dernière étape: le reste
      sequence.push(remaining);
      remaining = 0n;
    } else {
      // Étape normale
      sequence.push(stepAmount);
      remaining -= stepAmount;
    }

    stepAmount *= 2n; // Doubler
  }

  return sequence;
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});