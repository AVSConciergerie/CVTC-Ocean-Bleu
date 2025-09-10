import { ethers } from "hardhat";

async function main() {
  console.log("📖 GUIDE DE RÉCLAMATION MANUELLE DES FONDS");
  console.log("=".repeat(60));

  const oldContractAddress = "0x36FBc44E789e41F8383f11312e496aDc922CEEDa";
  const receiverAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";
  const transferId = 1;

  console.log("🎯 Vos 1001 CVTC sont bloqués dans l'ancien système");
  console.log(`📍 Contrat: ${oldContractAddress}`);
  console.log(`👤 Destinataire: ${receiverAddress}`);
  console.log(`🔢 Transfert ID: ${transferId}`);

  console.log("\n📋 État actuel du transfert:");
  console.log("   • Montant total: 1002.0 CVTC");
  console.log("   • Restant: 1002.0 CVTC");
  console.log("   • Étape actuelle: 0");
  console.log("   • Statut: Actif");
  console.log("   • Peut réclamer: ✅ OUI (dès maintenant)");

  console.log("\n🚀 OPTIONS DE RÉCLAMATION:");

  console.log("\n1️⃣ VIA L'INTERFACE FRONTEND (Recommandé):");
  console.log("   • Connectez-vous avec le wallet destinataire");
  console.log("   • Allez dans la section 'Mes Réclamations de Fonds'");
  console.log("   • Cliquez sur '🎁 Réclamer ma tranche'");
  console.log("   • La première tranche (1 CVTC) sera transférée immédiatement");

  console.log("\n2️⃣ VIA METAMASK/PORTFEUILLE (Manuel):");
  console.log("   • Connectez-vous à BSC Testnet");
  console.log(`   • Utilisez le wallet: ${receiverAddress}`);
  console.log(`   • Appelez la fonction: executeStaggeredRelease(${transferId})`);
  console.log(`   • Sur le contrat: ${oldContractAddress}`);
  console.log("   • Cela transférera 1 CVTC à votre wallet");

  console.log("\n3️⃣ VIA BSCSCAN (Expert):");
  console.log(`   • Allez sur: https://testnet.bscscan.com/address/${oldContractAddress}#writeContract`);
  console.log("   • Connectez votre wallet Metamask");
  console.log(`   • Trouvez la fonction: executeStaggeredRelease`);
  console.log(`   • Entrez: ${transferId}`);
  console.log("   • Cliquez sur 'Write'");

  console.log("\n⏰ CALENDRIER DE RÉCLAMATION:");
  console.log("   • Maintenant: 1 CVTC disponible");
  console.log("   • +15s: 2 CVTC");
  console.log("   • +30s: 4 CVTC");
  console.log("   • +45s: 8 CVTC");
  console.log("   • ... et ainsi de suite");

  console.log("\n💡 CONSEIL:");
  console.log("   • Utilisez l'option 1 (interface frontend) pour plus de simplicité");
  console.log("   • Vous pouvez réclamer chaque tranche quand vous voulez");
  console.log("   • Une fois réclamée, la tranche suivante devient disponible après 15 secondes");

  console.log("\n🎉 BONUS:");
  console.log("   • Après avoir testé l'ancien système, vous pourrez utiliser le nouveau système entièrement automatique !");
  console.log("   • Plus besoin de réclamer - réception passive garantie !");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});