import { ethers } from "hardhat";

async function main() {
  console.log("🔍 INVESTIGATION : Où sont passés les 3000+ CVTC ?");
  console.log("=" .repeat(60));

  const userAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const newContractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83";

  console.log(`👤 Adresse utilisateur: ${userAddress}`);
  console.log(`🪙 Token CVTC: ${cvtcTokenAddress}`);
  console.log(`🏢 Nouveau contrat: ${newContractAddress}`);
  console.log("");

  // Obtenir les contrats
  const CVTC_TOKEN = await ethers.getContractAt("IERC20", cvtcTokenAddress);

  console.log("📊 VÉRIFICATION DES SOLDES :");
  console.log("-" .repeat(40));

  // 1. Solde de l'utilisateur
  const userBalance = await CVTC_TOKEN.balanceOf(userAddress);
  console.log(`👤 Solde utilisateur: ${ethers.formatEther(userBalance)} CVTC`);

  // 2. Solde du nouveau contrat
  const contractBalance = await CVTC_TOKEN.balanceOf(newContractAddress);
  console.log(`🏢 Solde nouveau contrat: ${ethers.formatEther(contractBalance)} CVTC`);

  // 3. Supply total du token
  const totalSupply = await CVTC_TOKEN.totalSupply();
  console.log(`🌍 Supply total CVTC: ${ethers.formatEther(totalSupply)} CVTC`);

  console.log("");
  console.log("🔍 ANALYSE :");
  console.log("-" .repeat(40));

  if (contractBalance > 0) {
    console.log(`✅ ${ethers.formatEther(contractBalance)} CVTC trouvés dans le nouveau contrat`);
    console.log("💡 Ces tokens peuvent être récupérés via la fonction d'urgence");
  } else {
    console.log("❌ Aucun CVTC trouvé dans le nouveau contrat");
  }

  const missingTokens = ethers.parseEther("3000") - userBalance;
  if (missingTokens > 0) {
    console.log(`❌ ${ethers.formatEther(missingTokens)} CVTC manquants`);
  }

  console.log("");
  console.log("🚨 ACTIONS POSSIBLES :");
  console.log("-" .repeat(40));

  if (contractBalance >= ethers.parseEther("3000")) {
    console.log("✅ RESTAURATION POSSIBLE : Tous les tokens peuvent être récupérés");
    console.log("💡 Utiliser: npm run emergency-restore");
  } else if (contractBalance > 0) {
    console.log(`⚠️ RESTAURATION PARTIELLE : ${ethers.formatEther(contractBalance)} CVTC récupérables`);
    console.log("💡 Utiliser: npm run emergency-restore (montant ajusté)");
  } else {
    console.log("❌ RESTAURATION IMPOSSIBLE : Tokens introuvables");
    console.log("🔍 Besoin d'investigation supplémentaire");
  }

  console.log("");
  console.log("📋 PROCHAINES ÉTAPES :");
  console.log("-" .repeat(40));
  console.log("1. Vérifier les transactions récentes sur BSC Testnet");
  console.log("2. Examiner les logs du contrat");
  console.log("3. Contacter le support BSC si nécessaire");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur lors de l'investigation:", error);
    process.exit(1);
  });