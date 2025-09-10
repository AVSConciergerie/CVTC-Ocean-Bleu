import { ethers } from "hardhat";

async function main() {
  console.log("🔄 REDÉPLOIEMENT AVEC FONCTION D'URGENCE");
  console.log("=" .repeat(50));

  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const cvtcSwapAddress = "0xab6C658f36697325c3E7FE5c81d12d73f6A341C6";

  console.log(`🪙 Token CVTC: ${cvtcTokenAddress}`);
  console.log(`🔄 Swap: ${cvtcSwapAddress}`);
  console.log("");

  // Redéployer le contrat avec la fonction d'urgence
  console.log("📝 Redéploiement de CVTCPremium...");

  const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
  const premiumContract = await CVTCPremium.deploy(cvtcTokenAddress, cvtcSwapAddress);

  await premiumContract.waitForDeployment();

  const newContractAddress = await premiumContract.getAddress();
  console.log(`✅ Nouveau contrat déployé: ${newContractAddress}`);

  // Transférer les tokens de l'ancien contrat vers le nouveau
  console.log("\n💰 Récupération des tokens de l'ancien contrat...");

  const oldContractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83";

  // Cette partie nécessiterait de transférer les tokens de l'ancien contrat
  // vers le nouveau, puis d'appeler la fonction d'urgence

  console.log("🎯 Nouveau contrat prêt avec fonction d'urgence !");
  console.log(`📋 Adresse: ${newContractAddress}`);
  console.log("\n🔧 Prochaines étapes:");
  console.log("1. Transférer les tokens vers le nouveau contrat");
  console.log("2. Appeler recoverLostTokens() pour restituer à l'utilisateur");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });