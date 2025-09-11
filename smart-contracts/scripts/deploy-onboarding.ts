import { ethers } from "hardhat";

async function main() {
  console.log("Déploiement du contrat CVTCOnboarding...");

  // Adresses des contrats (à remplacer par les vraies adresses)
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3"; // BSC Testnet
  const CVTC_SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C"; // Pool déployé

  // Obtenir le signer
  const [deployer] = await ethers.getSigners();
  console.log("Déploiement avec le compte:", deployer.address);
  console.log("Solde du compte:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "BNB");

  // Déployer le contrat
  const CVTCOnboarding = await ethers.getContractFactory("CVTCOnboarding");
  const onboarding = await CVTCOnboarding.deploy(CVTC_TOKEN_ADDRESS, CVTC_SWAP_ADDRESS);

  await onboarding.waitForDeployment();

  const contractAddress = await onboarding.getAddress();
  console.log("✅ CVTCOnboarding déployé à l'adresse:", contractAddress);

  // Vérifier le déploiement
  console.log("\n🔍 Vérification du déploiement...");
  console.log("Token CVTC:", await onboarding.cvtcToken());
  console.log("Propriétaire:", await onboarding.owner());
  console.log("Prêt initial:", ethers.formatEther(await onboarding.INITIAL_LOAN()), "BNB");
  console.log("Swap quotidien:", ethers.formatEther(await onboarding.DAILY_SWAP_AMOUNT()), "BNB");

  // Configuration pour les tests
  console.log("\n⚙️ Configuration pour les tests...");
  console.log("Adresse du contrat:", contractAddress);
  console.log("Token CVTC:", CVTC_TOKEN_ADDRESS);

  // Sauvegarder l'adresse dans un fichier pour les tests
  const fs = require("fs");
  const deploymentInfo = {
    contractAddress: contractAddress,
    cvtcToken: CVTC_TOKEN_ADDRESS,
    deployer: deployer.address,
    network: "bsc-testnet",
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync("./deployments/onboarding-deployment.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("📄 Informations de déploiement sauvegardées dans ./deployments/onboarding-deployment.json");

  console.log("\n🎉 Déploiement terminé avec succès!");
  console.log("Prochaine étape: Intégration avec le pool de swap CVTCSwap");
}

// Gestion des erreurs
main().catch((error) => {
  console.error("❌ Erreur lors du déploiement:", error);
  process.exitCode = 1;
});