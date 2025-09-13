import { ethers } from "hardhat";

async function main() {
  console.log("🚀 DÉPLOIEMENT ET CONFIGURATION COMPLÈTE DU CONNECTOR");
  console.log("===================================================");

  // DÉPLOIEMENT
  console.log("🔨 PHASE 1: DÉPLOIEMENT");
  const CVTCContractConnector = await ethers.getContractFactory("CVTCContractConnector");
  const connector = await CVTCContractConnector.deploy();
  await connector.waitForDeployment();
  const connectorAddress = await connector.getAddress();

  console.log(`✅ Connector déployé: ${connectorAddress}`);

  // CONFIGURATION
  console.log("\n🔗 PHASE 2: CONFIGURATION");

  // Adresses des contrats existants
  const CVTC_SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  console.log(`📍 Swap Address: ${CVTC_SWAP_ADDRESS}`);
  console.log(`🪙 Token Address: ${CVTC_TOKEN_ADDRESS}`);

  // Connecter le contrat swap
  console.log("\n🔗 Connexion du contrat Swap...");
  const connectSwapTx = await connector.connectContract("swap", CVTC_SWAP_ADDRESS);
  await connectSwapTx.wait();
  console.log("✅ Contrat Swap connecté");

  // Vérifier la connexion
  const swapAddress = await connector.getContractAddress("swap");
  const isSwapActive = await connector.isContractActive("swap");
  console.log(`🔍 Swap connecté: ${swapAddress} (Actif: ${isSwapActive})`);

  // RÉSUMÉ FINAL
  console.log("\n🎉 DÉPLOIEMENT TERMINÉ !");
  console.log("========================");
  console.log(`📋 Connector Address: ${connectorAddress}`);
  console.log(`🔗 Swap Contract: ${CVTC_SWAP_ADDRESS}`);
  console.log(`🪙 Token Contract: ${CVTC_TOKEN_ADDRESS}`);

  // Sauvegarder les adresses pour les tests
  const deploymentInfo = {
    connector: connectorAddress,
    swap: CVTC_SWAP_ADDRESS,
    token: CVTC_TOKEN_ADDRESS,
    timestamp: new Date().toISOString(),
    network: "bscTestnet"
  };

  console.log("\n💾 Informations de déploiement sauvegardées");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

// Gestion des erreurs
main().catch((error) => {
  console.error("❌ Erreur lors du déploiement:", error);
  process.exitCode = 1;
});