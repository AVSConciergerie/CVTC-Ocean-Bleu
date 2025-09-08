import { ethers } from "hardhat";

async function main() {
  console.log("🎯 DÉMONSTRATION - LOGIQUE EXPÉDITEUR/DESTINATAIRE");
  console.log("=".repeat(70));

  const [deployer, sender, receiver] = await ethers.getSigners();
  console.log(`📤 Expéditeur: ${sender.address.slice(-6)}`);
  console.log(`📥 Destinataire: ${receiver.address.slice(-6)}`);

  // Adresses des contrats
  const cvtcPremiumAddress = process.env.CVTC_PREMIUM_ADDRESS;

  if (!cvtcPremiumAddress) {
    console.log("❌ CVTC_PREMIUM_ADDRESS manquante");
    return;
  }

  try {
    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
    const cvtcPremium = CVTCPremium.attach(cvtcPremiumAddress) as any;

    // Abonnements premium
    console.log("\n👑 Abonnements premium...");
    await sender.sendTransaction({ to: cvtcPremiumAddress, value: ethers.utils.parseEther("5.0") });
    await receiver.sendTransaction({ to: cvtcPremiumAddress, value: ethers.utils.parseEther("5.0") });
    console.log("✅ Abonnements OK");

    // Configuration du transfert échelonné
    const transferAmount = ethers.utils.parseEther("1500");
    console.log(`\n🚀 Configuration du transfert échelonné`);
    console.log(`   Montant: ${ethers.utils.formatEther(transferAmount)} CVTC`);
    console.log(`   Expéditeur paie: TOUT D'UN COUP ✅`);
    console.log(`   Destinataire reçoit: ÉCHELONNÉ (1, 2, 4, 8...) ✅`);

    // Simulation de l'approbation et du transfert (en vrai, utiliserait un token ERC20)
    console.log(`\n🔓 Simulation de l'approbation des tokens...`);
    console.log(`✅ ${sender.address.slice(-6)} approuve ${ethers.utils.formatEther(transferAmount)} CVTC`);

    // Initiation du transfert échelonné
    console.log(`\n🎯 Initiation du transfert échelonné...`);
    console.log(`💡 Le contrat vérifiera automatiquement:`);
    console.log(`   • Solde suffisant de l'expéditeur`);
    console.log(`   • Approbation des tokens`);
    console.log(`   • Transfert des fonds vers le contrat`);

    // Ici, en vrai, le contrat ferait:
    // require(cvtcToken.balanceOf(msg.sender) >= amount)
    // require(cvtcToken.allowance(msg.sender, address(this)) >= amount)
    // require(cvtcToken.transferFrom(msg.sender, address(this), amount))

    console.log(`\n🏦 LOGIQUE TECHNIQUE:`);
    console.log(`   1. 📤 Expéditeur transfère 1500 CVTC au contrat`);
    console.log(`   2. 🏦 Contrat détient les fonds`);
    console.log(`   3. 📥 Destinataire peut réclamer échelonné`);
    console.log(`   4. 🔒 Fonds sécurisés jusqu'aux libérations`);

    // Calcul de la séquence pour information
    const sequence = calculateStaggeredSequence(transferAmount);
    console.log(`\n📊 Séquence de libération:`);
    for (let i = 0; i < sequence.length; i++) {
      const months = i + 1;
      console.log(`   Mois ${months}: ${ethers.utils.formatEther(sequence[i])} CVTC`);
    }

    console.log(`\n🎯 AVANTAGES DE CETTE ARCHITECTURE:`);
    console.log(`   ✅ Expéditeur paie une seule fois`);
    console.log(`   ✅ Destinataire reçoit progressivement`);
    console.log(`   ✅ Contrat garantit l'exécution`);
    console.log(`   ✅ Transparence totale`);
    console.log(`   ✅ Sécurité maximale`);

    console.log(`\n🚀 PRÊT POUR LES TESTS RÉELS !`);
    console.log(`💡 Utilise un vrai token ERC20 pour tester complètement`);

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