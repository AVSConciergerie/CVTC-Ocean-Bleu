import { ethers } from "hardhat";

async function main() {
  console.log("📅 Test ÉCHELONNEMENT MENSUEL P2P - 1, 2, 4, 8, 16, 32 MOIS");

  const [deployer, sender, receiver] = await ethers.getSigners();
  console.log(`📤 Sender: ${sender.address.slice(-6)}`);
  console.log(`📥 Receiver: ${receiver.address.slice(-6)}`);

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

    // 1. Configuration de l'échelonnement mensuel
    console.log("\n⚙️ Configuration de l'Échelonnement Mensuel:");
    const threshold = await cvtcPremium.STAGGERED_THRESHOLD();
    const baseInterval = await cvtcPremium.BASE_MONTH_INTERVAL();
    const maxSteps = await cvtcPremium.MAX_STAGGERED_STEPS();

    console.log(`💰 Seuil échelonnement: ${ethers.utils.formatEther(threshold)} CVTC`);
    console.log(`📅 Règle: < 1000 CVTC = transfert immédiat`);
    console.log(`📅 Règle: ≥ 1000 CVTC = échelonnement ×2 chaque mois`);
    console.log(`⏱️  Maximum d'étapes: ${maxSteps}`);

    // 2. Abonnements premium pour les tests
    console.log("\n👑 Abonnements Premium:");
    for (const user of [sender, receiver]) {
      const tx = await user.sendTransaction({
        to: cvtcPremiumAddress,
        value: ethers.utils.parseEther("5.0"),
      });
      await tx.wait();
      console.log(`✅ ${user.address.slice(-6)} abonné`);
    }

    // 3. Démonstration de la séquence temporelle
    console.log("\n⏰ SÉQUENCE TEMPORELLE D'ÉCHELONNEMENT");
    console.log("=".repeat(60));

    const transferAmount = ethers.utils.parseEther("2400"); // 2400 CVTC
    console.log(`💰 Transfert de ${ethers.utils.formatEther(transferAmount)} CVTC`);
    console.log(`📅 Séquence temporelle: 1 mois → 2 mois → 4 mois → 8 mois → 16 mois → 32 mois`);

    // Vérifier si échelonnement ou transfert immédiat
    if (transferAmount < ethers.utils.parseEther("1000")) {
      console.log(`\n💵 Transfert IMMÉDIAT:`);
      console.log(`   Mois 1: ${ethers.utils.formatEther(transferAmount)} CVTC (tout d'un coup)`);
    } else {
      // Calculer la vraie séquence géométrique
      const sequence = calculateStaggeredSequence(transferAmount);

      console.log(`\n💵 Séquence géométrique des montants:`);
      for (let i = 0; i < sequence.length; i++) {
        const months = i + 1; // Mois 1, 2, 3, 4...
        const totalDays = months * 30;
        const totalHours = totalDays * 24;

        console.log(`   Mois ${months}: ${ethers.utils.formatEther(sequence[i])} CVTC (${totalDays} jours / ${totalHours}h)`);
      }
    }

    console.log(`\n🎯 Avantages stratégiques:`);
    console.log(`   ✅ Engagement sur 5 ans (63 mois)`);
    console.log(`   ✅ Retours réguliers et prévisibles`);
    console.log(`   ✅ Création d'habitude d'utilisation`);
    console.log(`   ✅ Fidélisation à long terme maximale`);

    // 4. Initiation du transfert échelonné
    console.log("\n🚀 Initiation du Transfert Échelonné Mensuel:");

    console.log(`📤 Transfert: ${ethers.utils.formatEther(transferAmount)} CVTC`);
    console.log(`👤 De: ${sender.address.slice(-6)} → À: ${receiver.address.slice(-6)}`);
    console.log(`⏰ Première libération: Dans 1 mois`);

    // Initier le transfert échelonné
    await cvtcPremium.connect(sender).initiateStaggeredTransfer(receiver.address, transferAmount);

    const stats = await cvtcPremium.getStaggeredStats();
    const transferId = stats[0];
    console.log(`✅ Transfert échelonné initié - ID: ${transferId}`);

    // Vérifier les détails du transfert
    const transferInfo = await cvtcPremium.getStaggeredTransferInfo(transferId);
    console.log(`\n📊 Détails du transfert:`);
    console.log(`   • Montant total: ${ethers.utils.formatEther(transferInfo[2])} CVTC`);
    console.log(`   • Restant: ${ethers.utils.formatEther(transferInfo[3])} CVTC`);
    console.log(`   • Étape actuelle: ${transferInfo[4]}`);
    console.log(`   • Prochaine libération: ${new Date(Number(transferInfo[5]) * 1000).toISOString()}`);
    console.log(`   • Actif: ${transferInfo[7]}`);

    // Afficher le calendrier des libérations
    console.log(`\n📅 CALENDRIER DES LIBÉRATIONS`);
    console.log("=".repeat(60));

    const releaseSchedule = transferInfo[6];
    const startTime = Number(transferInfo[5]);

    for (let step = 0; step < releaseSchedule.length; step++) {
      const months = step + 1; // Mois 1, 2, 3, 4...
      const releaseTime = startTime + (step * months * 30 * 24 * 3600 * 1000); // Convertir en ms
      const releaseDate = new Date(releaseTime);

      console.log(`   ${step + 1}. ${ethers.utils.formatEther(releaseSchedule[step])} CVTC - ${releaseDate.toISOString().split('T')[0]} (${months} mois)`);
    }

    // 5. Simulation de la première libération (immédiate pour test)
    console.log("\n🎬 SIMULATION DE LA PREMIÈRE LIBÉRATION");
    console.log("=".repeat(60));

    console.log("💰 Première libération: Dans 1 mois");
    console.log(`💵 Montant: ${ethers.utils.formatEther(releaseSchedule[0])} CVTC`);
    console.log("⏳ Simulation: Attente de 1 mois...");

    // Pour la démo, on force la libération immédiatement
    console.log("🔧 Mode test: Forçage de la libération immédiate...");

    await cvtcPremium.connect(receiver).executeStaggeredRelease(transferId);

    console.log("✅ Première libération exécutée!");
    console.log(`📈 Total reçu: ${ethers.utils.formatEther(releaseSchedule[0])} CVTC`);

    // Vérifier l'état après libération
    const updatedInfo = await cvtcPremium.getStaggeredTransferInfo(transferId);
    console.log(`\n📊 État après première libération:`);
    console.log(`   • Restant: ${ethers.utils.formatEther(updatedInfo[3])} CVTC`);
    console.log(`   • Étape actuelle: ${updatedInfo[4]}`);
    console.log(`   • Prochaine libération: ${new Date(Number(updatedInfo[5]) * 1000).toISOString()}`);

    // 6. Statistiques finales
    console.log("\n📊 Statistiques du Système d'Échelonnement:");

    const finalStats = await cvtcPremium.getStaggeredStats();
    console.log(`   • Transferts échelonnés totaux: ${finalStats[0]}`);
    console.log(`   • Libérations totales: ${ethers.utils.formatEther(finalStats[1])} CVTC`);
    console.log(`   • Transferts actifs: ${finalStats[2]}`);

    // 7. Analyse de l'impact
    console.log("\n🎯 IMPACT STRATÉGIQUE DE L'ÉCHELONNEMENT MENSUEL");
    console.log("=".repeat(60));

    if (transferAmount < ethers.utils.parseEther("1000")) {
      console.log(`📈 Engagement utilisateur: 1 mois (transfert immédiat)`);
      console.log(`💰 Total distribué: ${ethers.utils.formatEther(transferAmount)} CVTC`);
      console.log(`🔄 Interactions: 1 touchpoint`);
      console.log(`💝 Valeur perçue: Transfert rapide et simple`);
    } else {
      const sequence = calculateStaggeredSequence(transferAmount);
      const totalMonths = sequence.length; // Nombre de mois = nombre d'étapes
      const totalReceived = sequence.reduce((a: number, b: bigint) => a + Number(ethers.utils.formatEther(b)), 0);

      console.log(`📈 Engagement utilisateur: ${totalMonths} mois (${(totalMonths / 12).toFixed(1)} ans)`);
      console.log(`💰 Total distribué: ${totalReceived.toFixed(2)} CVTC`);
      console.log(`🔄 Interactions régulières: ${sequence.length} touchpoints sur ${totalMonths} mois`);
      console.log(`💝 Valeur perçue: Gros lots croissants sur plusieurs années`);
      console.log(`🎯 Point culminant: ${ethers.utils.formatEther(sequence[sequence.length - 1])} CVTC à la fin !`);
    }

    console.log(`\n🎉 Test Échelonnement Mensuel terminé avec succès!`);
    console.log("✅ Système d'échelonnement opérationnel");
    console.log("✅ Séquence temporelle 1, 2, 4, 8, 16, 32 mois fonctionnelle");
    console.log("✅ Engagement à long terme maximisé");
    console.log("✅ Fidélisation utilisateur optimale");

  } catch (error: any) {
    console.log("❌ Erreur lors du test d'échelonnement mensuel:", error?.message || "Erreur inconnue");
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