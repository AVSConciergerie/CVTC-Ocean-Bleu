import { ethers } from "hardhat";

async function main() {
  console.log("⚡ DÉMO ACCÉLÉRÉE - 15 SECONDES = 1 MOIS");
  console.log("=".repeat(60));

  const [deployer, sender, receiver] = await ethers.getSigners();

  // Adresses des contrats
  const cvtcPremiumAddress = process.env.CVTC_PREMIUM_ADDRESS;

  if (!cvtcPremiumAddress) {
    console.log("❌ CVTC_PREMIUM_ADDRESS manquante");
    return;
  }

  try {
    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
    const cvtcPremium = CVTCPremium.attach(cvtcPremiumAddress) as any;

    // Vérifier le mode test
    const isTestMode = await cvtcPremium.isTestMode();
    console.log(`🧪 Mode test: ${isTestMode ? "ACTIVÉ ✅" : "DÉSACTIVÉ ❌"}`);

    // Abonnements rapides
    console.log("\n👑 Abonnements premium rapides...");
    await sender.sendTransaction({ to: cvtcPremiumAddress, value: ethers.utils.parseEther("5.0") });
    await receiver.sendTransaction({ to: cvtcPremiumAddress, value: ethers.utils.parseEther("5.0") });
    console.log("✅ Abonnements OK");

    // Démonstration de l'accélération
    console.log("\n🚀 DÉMONSTRATION DE L'ACCÉLÉRATION");
    console.log("=".repeat(60));

    const transferAmount = ethers.utils.parseEther("1500");
    console.log(`💰 Transfert: ${ethers.utils.formatEther(transferAmount)} CVTC`);

    // Mode normal vs accéléré
    console.log(`\n📊 COMPARAISON DES MODES:`);
    console.log(`   Mode NORMAL: 1 mois = 30 jours = 720 heures = 43,200 minutes`);
    console.log(`   Mode ACCÉLÉRÉ: 1 mois = 15 secondes ⚡`);
    console.log(`   🚀 ACCÉLÉRATION: ${43200 / 15}x plus rapide !`);

    // Calcul de la séquence accélérée
    const sequence = calculateStaggeredSequence(transferAmount);
    console.log(`\n⏱️  CALENDRIER ACCÉLÉRÉ:`);
    for (let i = 0; i < sequence.length; i++) {
      const months = i + 1;
      const acceleratedSeconds = months * 15;
      const normalDays = months * 30;

      console.log(`   Mois ${months}: ${ethers.utils.formatEther(sequence[i])} CVTC`);
      console.log(`      ⏱️  Accéléré: ${acceleratedSeconds} secondes`);
      console.log(`      📅 Normal: ${normalDays} jours`);
    }

    // Calcul du temps total
    const totalAcceleratedSeconds = sequence.length * 15;
    const totalNormalDays = sequence.length * 30;
    const accelerationFactor = (totalNormalDays * 24 * 3600) / totalAcceleratedSeconds;

    console.log(`\n🎯 RÉSULTATS:`);
    console.log(`   • Étapes: ${sequence.length}`);
    console.log(`   • Temps accéléré: ${totalAcceleratedSeconds} secondes`);
    console.log(`   • Temps normal: ${totalNormalDays} jours`);
    console.log(`   • Accélération: ${Math.round(accelerationFactor)}x plus rapide !`);

    // Initiation du transfert accéléré
    console.log(`\n🚀 Initiation du transfert accéléré...`);
    await cvtcPremium.connect(sender).initiateStaggeredTransfer(receiver.address, transferAmount);

    const stats = await cvtcPremium.getStaggeredStats();
    const transferId = stats[0];
    console.log(`✅ Transfert accéléré initié - ID: ${transferId}`);

    // Test de la première libération accélérée
    console.log(`\n🎬 TEST DE LA PREMIÈRE LIBÉRATION ACCÉLÉRÉE`);
    console.log(`⏱️  Attente: 15 secondes (au lieu de 30 jours)`);

    console.log(`⏳ Attente accélérée...`);
    await new Promise(resolve => setTimeout(resolve, 15000)); // 15 secondes

    // Exécuter la libération
    await cvtcPremium.connect(receiver).executeStaggeredRelease(transferId);

    const transferInfo = await cvtcPremium.getStaggeredTransferInfo(transferId);
    console.log(`✅ Première libération exécutée !`);
    console.log(`📈 Reçu: ${ethers.utils.formatEther(transferInfo[3])} CVTC restants`);

    console.log(`\n🎉 ACCÉLÉRATION OPÉRATIONNELLE !`);
    console.log(`⚡ Tu peux maintenant tester toutes les libérations mensuelles en 15 secondes chacune !`);

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