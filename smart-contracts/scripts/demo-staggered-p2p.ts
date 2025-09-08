import { ethers } from "hardhat";

async function main() {
  console.log("📅 DÉMO - Échelonnement MENSUEL P2P: 1, 2, 4, 8, 16, 32 MOIS");

  const [deployer, sender, receiver] = await ethers.getSigners();
  console.log(`📤 Sender: ${sender.address.slice(-6)}`);
  console.log(`📥 Receiver: ${receiver.address.slice(-6)}`);

  // Adresses des contrats
  const cvtcPremiumAddress = process.env.CVTC_PREMIUM_ADDRESS;

  if (!cvtcPremiumAddress) {
    console.log("❌ Contrat non déployé. Lancez d'abord:");
    console.log("npx hardhat run scripts/deploy-all.ts --network bscTestnet");
    return;
  }

  try {
    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
    const cvtcPremium = CVTCPremium.attach(cvtcPremiumAddress) as any;

    // Abonnements rapides
    console.log("\n👑 Abonnements premium...");
    await sender.sendTransaction({ to: cvtcPremiumAddress, value: ethers.utils.parseEther("5.0") });
    await receiver.sendTransaction({ to: cvtcPremiumAddress, value: ethers.utils.parseEther("5.0") });
    console.log("✅ Abonnements OK");

    // Démonstration de l'échelonnement mensuel
    console.log("\n🎯 DÉMONSTRATION DE L'ÉCHELONNEMENT MENSUEL");
    console.log("=".repeat(60));

    const transferAmount = ethers.utils.parseEther("1500"); // 1500 CVTC
    console.log(`💰 Transfert de ${ethers.utils.formatEther(transferAmount)} CVTC`);

    if (transferAmount < ethers.utils.parseEther("1000")) {
      console.log(`📅 Transfert IMMÉDIAT (montant < 1000 CVTC)`);
      console.log(`   Mois 1: ${ethers.utils.formatEther(transferAmount)} CVTC (tout d'un coup)`);
    } else {
      console.log(`📅 ÉCHELONNEMENT ACTIVÉ (montant ≥ 1000 CVTC)`);
      console.log(`📋 Séquence: ×2 chaque mois jusqu'à épuisement`);

      // Calculer la vraie séquence géométrique
      const sequence = calculateMonthlyStaggeredSequence(transferAmount);

      console.log(`\n📊 Calendrier des libérations:`);
      for (let i = 0; i < sequence.length; i++) {
        const months = i + 1; // Mois 1, 2, 3, 4...
        const totalDays = months * 30;
        const totalHours = totalDays * 24;

        console.log(`   Mois ${months}: ${ethers.utils.formatEther(sequence[i])} CVTC (${totalDays} jours / ${totalHours}h)`);
      }

      console.log(`\n⏱️  Durée totale d'engagement: ${sequence.length} mois`);
      console.log(`💡 Avantages stratégiques:`);
      console.log(`   ✅ Montants croissants = suspense croissant`);
      console.log(`   ✅ Engagement progressif sur plusieurs mois`);
      console.log(`   ✅ Gros lots de fin = excitation maximale`);
      console.log(`   ✅ Fidélisation maximale`);
    }

    // Initiation du transfert
    console.log("\n🚀 Initiation du transfert échelonné...");
    await cvtcPremium.connect(sender).initiateStaggeredTransfer(receiver.address, transferAmount);

    const stats = await cvtcPremium.getStaggeredStats();
    const transferId = stats[0];
    console.log(`✅ Transfert initié - ID: ${transferId}`);

    // Simulation des libérations mensuelles
    console.log("\n🎬 SIMULATION DES LIBÉRATIONS MENSUELLES");
    console.log("=".repeat(60));

    let totalReceived = 0;
    const transferInfo = await cvtcPremium.getStaggeredTransferInfo(transferId);
    const releaseSchedule = transferInfo[6]; // Récupérer le calendrier du contrat

    for (let step = 0; step < releaseSchedule.length; step++) {
      console.log(`\n🎯 ÉTAPE ${step + 1}/${releaseSchedule.length}`);

      const months = step + 1; // Mois 1, 2, 3, 4...
      const releaseAmount = releaseSchedule[step];

      console.log(`💰 Montant à libérer: ${ethers.utils.formatEther(releaseAmount)} CVTC`);
      console.log(`📅 Délai d'attente: ${months} mois`);

      // Simuler l'attente (en vrai, ce serait automatique)
      if (step > 0) {
        console.log(`⏳ Attente de ${months} mois... (simulation)`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 seconde pour la démo
      }

      // Exécuter la libération
      await cvtcPremium.connect(receiver).executeStaggeredRelease(transferId);

      totalReceived += Number(ethers.utils.formatEther(releaseAmount));
      console.log(`✅ Libération exécutée!`);
      console.log(`📈 Total reçu: ${totalReceived} CVTC`);

      // Afficher le progrès
      const progress = ((totalReceived / 1500) * 100).toFixed(1);
      console.log(`📊 Progrès: ${progress}% du transfert total`);
    }

    console.log("\n🎉 TRANSFERT ÉCHELONNÉ MENSUEL TERMINÉ !");
    console.log("=".repeat(60));
    console.log(`✅ Total transféré: ${totalReceived} CVTC`);
    console.log(`✅ Durée d'engagement: 63 mois (~5.25 ans)`);
    console.log(`✅ Suspense maintenu: ✅`);
    console.log(`✅ Engagement utilisateur: ✅`);
    console.log(`✅ Fidélisation maximale: ✅`);
    console.log(`✅ Effet viral: ✅`);

    // Statistiques finales
    const finalStats = await cvtcPremium.getStaggeredStats();
    console.log(`\n📊 Statistiques du Système:`);
    console.log(`   • Transferts échelonnés: ${finalStats[0]}`);
    console.log(`   • Total libéré: ${ethers.utils.formatEther(finalStats[1])} CVTC`);
    console.log(`   • Transferts actifs: ${finalStats[2]}`);

  } catch (error: any) {
    console.log("❌ Erreur:", error?.message || "Erreur inconnue");
  }
}

// Fonction utilitaire pour calculer la séquence d'échelonnement géométrique
function calculateMonthlyStaggeredSequence(totalAmount: bigint): bigint[] {
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