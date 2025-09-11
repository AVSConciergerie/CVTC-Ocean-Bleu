import { ethers } from "hardhat";

async function main() {
  console.log("🔧 Configuration du pool de swap invisible pour l'onboarding...");

  // Adresses des contrats
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3"; // BSC Testnet
  const INITIAL_LIQUIDITY_BNB = ethers.parseEther("10"); // 10 BNB de liquidité initiale
  const INITIAL_LIQUIDITY_CVTC = ethers.parseEther("10000"); // 10,000 CVTC

  const [deployer] = await ethers.getSigners();
  console.log("Déploiement avec le compte:", deployer.address);

  // Étape 1: Déployer le pool de swap CVTC
  console.log("\n📦 Étape 1: Déploiement du pool de swap CVTC");
  const CVTCSwap = await ethers.getContractFactory("CVTCSwap");
  const cvtcSwap = await CVTCSwap.deploy(CVTC_TOKEN_ADDRESS);

  await cvtcSwap.waitForDeployment();
  const swapAddress = await cvtcSwap.getAddress();

  console.log("✅ Pool de swap déployé:", swapAddress);

  // Étape 2: Approuver le transfert de CVTC pour la liquidité
  console.log("\n🔑 Étape 2: Approbation du transfert CVTC");
  const cvtcToken = await ethers.getContractAt("IERC20", CVTC_TOKEN_ADDRESS);

  // Vérifier le solde CVTC du déployeur
  const cvtcBalance = await cvtcToken.balanceOf(deployer.address);
  console.log("Solde CVTC du déployeur:", ethers.formatEther(cvtcBalance));

  if (cvtcBalance < INITIAL_LIQUIDITY_CVTC) {
    console.log("⚠️ Solde CVTC insuffisant. Veuillez obtenir des CVTC avant de continuer.");
    console.log("CVTC nécessaires:", ethers.formatEther(INITIAL_LIQUIDITY_CVTC));
    return;
  }

  // Approuver le transfert
  const approveTx = await cvtcToken.approve(swapAddress, INITIAL_LIQUIDITY_CVTC);
  await approveTx.wait();
  console.log("✅ Approbation CVTC accordée");

  // Étape 3: Ajouter la liquidité initiale
  console.log("\n💧 Étape 3: Ajout de la liquidité initiale");
  console.log("Ajout de", ethers.formatEther(INITIAL_LIQUIDITY_BNB), "BNB");
  console.log("Ajout de", ethers.formatEther(INITIAL_LIQUIDITY_CVTC), "CVTC");

  const addLiquidityTx = await cvtcSwap.addLiquidity(INITIAL_LIQUIDITY_CVTC, {
    value: INITIAL_LIQUIDITY_BNB
  });
  await addLiquidityTx.wait();
  console.log("✅ Liquidité ajoutée avec succès");

  // Étape 4: Vérifier les réserves
  console.log("\n📊 Étape 4: Vérification des réserves");
  const reserves = await cvtcSwap.getReserves();
  console.log("Réserves BNB:", ethers.formatEther(reserves[0]));
  console.log("Réserves CVTC:", ethers.formatEther(reserves[1]));

  // Étape 5: Configurer les autorisations pour l'onboarding
  console.log("\n⚙️ Étape 5: Configuration des autorisations");

  // Ajouter le déployeur comme owner bot (pour les tests)
  await cvtcSwap.updateOwnerBot(deployer.address, true);
  console.log("✅ Déployeur ajouté comme owner bot");

  // Étape 6: Sauvegarder la configuration
  console.log("\n💾 Étape 6: Sauvegarde de la configuration");
  const config = {
    cvtcToken: CVTC_TOKEN_ADDRESS,
    cvtcSwap: swapAddress,
    initialLiquidityBNB: INITIAL_LIQUIDITY_BNB.toString(),
    initialLiquidityCVTC: INITIAL_LIQUIDITY_CVTC.toString(),
    deployedAt: new Date().toISOString(),
    network: "bsc-testnet"
  };

  const fs = require("fs");
  fs.writeFileSync("./deployments/swap-pool-config.json", JSON.stringify(config, null, 2));
  console.log("📄 Configuration sauvegardée dans ./deployments/swap-pool-config.json");

  // Étape 7: Résumé final
  console.log("\n🎉 Configuration terminée avec succès!");
  console.log("=== RÉSUMÉ ===");
  console.log("Token CVTC:", CVTC_TOKEN_ADDRESS);
  console.log("Pool de Swap:", swapAddress);
  console.log("Liquidité BNB:", ethers.formatEther(INITIAL_LIQUIDITY_BNB));
  console.log("Liquidité CVTC:", ethers.formatEther(INITIAL_LIQUIDITY_CVTC));
  console.log("Prix initial approximatif: 1 CVTC ≈", Number(INITIAL_LIQUIDITY_BNB) / Number(INITIAL_LIQUIDITY_CVTC), "BNB");

  console.log("\n📋 Prochaines étapes:");
  console.log("1. Déployer le contrat CVTCOnboarding avec l'adresse du pool");
  console.log("2. Tester l'intégration complète");
  console.log("3. Configurer l'automatisation des swaps quotidiens");
}

// Gestion des erreurs
main().catch((error) => {
  console.error("❌ Erreur lors de la configuration:", error);
  process.exitCode = 1;
});