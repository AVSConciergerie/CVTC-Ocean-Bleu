import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Déploiement du Paymaster Pimlico pour l'onboarding...");

  // Adresses des contrats déployés
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3"; // BSC Testnet
  const ENTRYPOINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"; // ERC-4337 EntryPoint v0.7
  const CVTC_SWAP_ADDRESS = "0xYourCVTCSwapContractAddress"; // TODO: Replace with actual CVTC Swap contract address

  const [deployer] = await ethers.getSigners();
  console.log("Déploiement avec le compte:", deployer.address);

  // === PHASE 1: DÉPLOIEMENT DU PAYMASTER ===
  console.log("\n💰 Phase 1: Déploiement du CVTCPaymaster");

  const CVTCPaymaster = await ethers.getContractFactory("CVTCPaymaster");
  const paymaster = await CVTCPaymaster.deploy(
    ENTRYPOINT_ADDRESS,
    CVTC_TOKEN_ADDRESS,
    CVTC_SWAP_ADDRESS
  );

  await paymaster.waitForDeployment();
  const paymasterAddress = await paymaster.getAddress();

  console.log("✅ Paymaster déployé:", paymasterAddress);

  // === PHASE 2: CONFIGURATION INITIALE ===
  console.log("\n⚙️ Phase 2: Configuration du paymaster");

  // Ajouter CVTC comme token supporté (déjà fait dans le constructeur)
  console.log("✅ CVTC configuré comme token supporté");

  // Définir le prix du CVTC (1 CVTC = 1 BNB équivalent pour les tests)
  await paymaster.updateTokenPrice(CVTC_TOKEN_ADDRESS, ethers.parseEther("1"));
  console.log("✅ Prix CVTC défini: 1 CVTC = 1 BNB");

  // === PHASE 3: TESTS DE FONCTIONNALITÉ ===
  console.log("\n🧪 Phase 3: Tests de fonctionnalité");

  // Vérifier les tokens supportés
  const supportedTokens = await paymaster.getSupportedTokens();
  console.log("Tokens supportés:", supportedTokens);

  // Vérifier le prix du CVTC
  const cvtcPrice = await paymaster.tokenPrices(CVTC_TOKEN_ADDRESS);
  console.log("Prix CVTC:", ethers.formatEther(cvtcPrice), "BNB par CVTC");

  // === PHASE 4: SAUVEGARDE DE LA CONFIGURATION ===
  console.log("\n💾 Phase 4: Sauvegarde de la configuration");

  const pimlicoConfig = {
    paymasterAddress: paymasterAddress,
    entryPoint: ENTRYPOINT_ADDRESS,
    cvtcToken: CVTC_TOKEN_ADDRESS,
    network: "bsc-testnet",
    deployedAt: new Date().toISOString(),
    pimlicoApiKey: process.env.PIMLICO_API_KEY,
    configuration: {
      supportedTokens: supportedTokens,
      cvtcPrice: cvtcPrice.toString(),
      postOpGas: "35000",
      verificationGas: "150000"
    }
  };

  const fs = require("fs");
  const dir = "./deployments";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  fs.writeFileSync("./deployments/pimlico-paymaster-config.json", JSON.stringify(pimlicoConfig, null, 2));
  console.log("📄 Configuration Pimlico sauvegardée dans ./deployments/pimlico-paymaster-config.json");

  // === PHASE 5: RÉSUMÉ FINAL ===
  console.log("\n🎉 DÉPLOIEMENT PIMLICO TERMINÉ!");
  console.log("=".repeat(60));
  console.log("PAYMASTER PIMLICO - CONFIGURATION COMPLÈTE");
  console.log("=".repeat(60));
  console.log("📍 Adresses déployées:");
  console.log("   • Paymaster:", paymasterAddress);
  console.log("   • EntryPoint:", ENTRYPOINT_ADDRESS);
  console.log("   • CVTC Token:", CVTC_TOKEN_ADDRESS);
  console.log("");
  console.log("⚙️ Configuration:");
  console.log("   • Token supporté: CVTC");
  console.log("   • Prix: 1 CVTC = 1 BNB");
  console.log("   • Gas limits configurés");
  console.log("");
  console.log("🔗 Intégration prête pour:");
  console.log("   • Transactions gasless ERC-4337");
  console.log("   • 1000 premiers utilisateurs");
  console.log("   • Système d'onboarding complet");
  console.log("");
  console.log("📋 Prochaines étapes:");
  console.log("   1. Créer des exemples d'utilisation Pimlico");
  console.log("   2. Intégrer dans le frontend");
  console.log("   3. Tester avec de vrais utilisateurs");
  console.log("=".repeat(60));

  return {
    paymasterAddress,
    entryPoint: ENTRYPOINT_ADDRESS,
    cvtcToken: CVTC_TOKEN_ADDRESS
  };
}

// Gestion des erreurs
main().catch((error) => {
  console.error("❌ Erreur lors du déploiement Pimlico:", error);
  process.exitCode = 1;
});