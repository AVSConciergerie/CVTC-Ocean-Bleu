import { ethers } from "hardhat";

async function main() {
  console.log("🎁 Réclamation manuelle des fonds échelonnés");
  console.log("Utilisez cette commande pour réclamer les fonds depuis le wallet destinataire");

  const contractAddress = "0x36FBc44E789e41F8383f11312e496aDc922CEEDa";
  const transferId = 1; // ID du transfert à réclamer

  console.log(`\n📋 Informations pour la réclamation:`);
  console.log(`   Contrat: ${contractAddress}`);
  console.log(`   Transfert ID: ${transferId}`);
  console.log(`   Fonction: executeStaggeredRelease(uint256)`);

  console.log(`\n🔧 Pour réclamer manuellement:`);
  console.log(`1. Connectez-vous au wallet destinataire: 0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389`);
  console.log(`2. Appelez la fonction executeStaggeredRelease(${transferId}) sur le contrat ${contractAddress}`);
  console.log(`3. La première tranche (1 CVTC) sera transférée automatiquement`);

  console.log(`\n💡 Vous pouvez aussi utiliser l'interface frontend qui a été mise à jour avec un bouton de réclamation.`);
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});