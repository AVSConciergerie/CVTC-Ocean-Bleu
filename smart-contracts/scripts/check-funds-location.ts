import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Recherche des 1001 CVTC envoyés précédemment");

  try {
    // Ancien contrat où le transfert a été fait
    const oldContractAddress = "0x36FBc44E789e41F8383f11312e496aDc922CEEDa";

    // Nouveau contrat
    const newContractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83";

    // Adresse du token CVTC
    const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";

    // Se connecter aux contrats
    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
    const oldContract = CVTCPremium.attach(oldContractAddress);
    const newContract = CVTCPremium.attach(newContractAddress);

    const CVTCToken = await ethers.getContractAt("IERC20", cvtcTokenAddress);

    console.log("📊 Vérification des soldes :");

    // Vérifier le solde de l'ancien contrat
    const oldContractBalance = await CVTCToken.balanceOf(oldContractAddress);
    console.log(`💰 Solde ancien contrat (${oldContractAddress}): ${ethers.formatUnits(oldContractBalance, 2)} CVTC`);

    // Vérifier le solde du nouveau contrat
    const newContractBalance = await CVTCToken.balanceOf(newContractAddress);
    console.log(`💰 Solde nouveau contrat (${newContractAddress}): ${ethers.formatUnits(newContractBalance, 2)} CVTC`);

    // Vérifier l'état du transfert dans l'ancien contrat
    console.log("\n📋 État du transfert dans l'ancien contrat :");
    const stats = await oldContract.getStaggeredStats();
    console.log(`   - Transferts totaux: ${stats[0]}`);
    console.log(`   - Libérations totales: ${stats[1]}`);
    console.log(`   - Transferts actifs: ${stats[2]}`);

    if (stats[0] > 0) {
      const transfer = await oldContract.getStaggeredTransferInfo(1);
      console.log(`\n📋 Détails du transfert ID 1 :`);
      console.log(`   - Expéditeur: ${transfer[0]}`);
      console.log(`   - Destinataire: ${transfer[1]}`);
      console.log(`   - Montant total: ${ethers.formatUnits(transfer[2], 2)} CVTC`);
      console.log(`   - Restant: ${ethers.formatUnits(transfer[3], 2)} CVTC`);
      console.log(`   - Étape actuelle: ${transfer[4]}`);
      console.log(`   - Actif: ${transfer[7]}`);

      if (transfer[7]) { // isActive
        console.log(`   - Prochaine libération: ${new Date(Number(transfer[5]) * 1000).toLocaleString()}`);
        console.log(`   - Séquence: [${transfer[6].map((s: bigint) => ethers.formatUnits(s, 2)).join(', ')}]`);
      }
    }

    // Calcul du total des fonds bloqués
    const totalLocked = Number(ethers.formatUnits(oldContractBalance, 2)) + Number(ethers.formatUnits(newContractBalance, 2));
    console.log(`\n💎 Total des CVTC bloqués dans les contrats: ${totalLocked} CVTC`);

    if (totalLocked >= 1001) {
      console.log("✅ Les 1001 CVTC sont bien bloqués dans l'ancien contrat !");
      console.log("🔄 Ils peuvent être récupérés ou migrés vers le nouveau système automatique.");
    } else {
      console.log("❌ Il semble qu'il manque des fonds. Vérification nécessaire.");
    }

  } catch (error: any) {
    console.log("❌ Erreur:", error?.message || "Erreur inconnue");
  }
}

main().catch((error) => {
  console.error("❌ Erreur critique:", error);
  process.exitCode = 1;
});