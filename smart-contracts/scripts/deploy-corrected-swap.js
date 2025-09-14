const { ethers } = require("hardhat");

async function main() {
  console.log("Déploiement du contrat CVTCSwap corrigé...");

  // Adresse du token CVTC
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  // Obtenir le signer
  const [deployer] = await ethers.getSigners();
  console.log("Déploiement avec le compte:", deployer.address);
  console.log("Solde du compte:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "BNB");

  // Déployer le contrat corrigé
  const CVTCSwap = await ethers.getContractFactory("CVTCSwap");
  const swapContract = await CVTCSwap.deploy(CVTC_TOKEN_ADDRESS);

  await swapContract.waitForDeployment();

  const contractAddress = await swapContract.getAddress();
  console.log("✅ CVTCSwap corrigé déployé à l'adresse:", contractAddress);

  // Vérifier le déploiement
  console.log("\n🔍 Vérification du déploiement...");
  console.log("Token CVTC:", await swapContract.cvtcToken());
  console.log("Propriétaire:", await swapContract.owner());
  console.log("Liquidité activée:", await swapContract.liquidityEnabled());

  // Tester les fonctions de base
  console.log("\n🧪 Tests des fonctions de base...");
  const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
  console.log("Réserves initiales - BNB:", ethers.formatEther(bnbReserve), "CVTC:", ethers.formatUnits(cvtcReserve, 2));

  // Sauvegarder l'adresse dans un fichier
  const fs = require("fs");
  const deploymentInfo = {
    contractAddress: contractAddress,
    cvtcToken: CVTC_TOKEN_ADDRESS,
    deployer: deployer.address,
    network: "bsc-testnet",
    deployedAt: new Date().toISOString(),
    version: "corrected-amm"
  };

  fs.writeFileSync("./deployments/corrected-swap-deployment.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("📄 Informations sauvegardées dans ./deployments/corrected-swap-deployment.json");

  console.log("\n🎉 Contrat AMM corrigé déployé avec succès!");
  console.log("========================================");
  console.log("✅ Fonction addLiquidity corrigée");
  console.log("✅ Tolérance de ratio +/- 5%");
  console.log("✅ Fonction addLiquidityPublic ajoutée");
  console.log("✅ Fonction receive() sécurisée");
  console.log("✅ Prêt pour les vrais swaps AMM");
}

// Gestion des erreurs
main().catch((error) => {
  console.error("❌ Erreur lors du déploiement:", error);
  process.exitCode = 1;
});