import { ethers } from "hardhat";

async function main() {
  console.log("🔗 CONFIGURATION DU CVTC CONTRACT CONNECTOR");
  console.log("===========================================");

  // Adresses des contrats existants
  const CONNECTOR_ADDRESS = "0x..."; // À remplacer par l'adresse du connector déployé
  const CVTC_SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  // Se connecter au connector
  const connector = await ethers.getContractAt("CVTCContractConnector", CONNECTOR_ADDRESS);

  console.log("🔗 Connexion des contrats existants...");

  // 1. Connecter le pool de swap
  console.log("🏦 Connexion du pool de swap...");
  await connector.connectContract("swap", CVTC_SWAP_ADDRESS);
  console.log("✅ Pool de swap connecté");

  // 2. Connecter le token CVTC
  console.log("💰 Connexion du token CVTC...");
  await connector.connectContract("token", CVTC_TOKEN_ADDRESS);
  console.log("✅ Token CVTC connecté");

  // 3. Vérifier les connexions
  console.log("\n📋 VÉRIFICATION DES CONNEXIONS:");

  const isSwapActive = await connector.isContractActive("swap");
  console.log(`🏦 Pool Swap actif: ${isSwapActive}`);

  const swapAddress = await connector.getContractAddress("swap");
  console.log(`🏦 Adresse Pool Swap: ${swapAddress}`);

  const isTokenActive = await connector.isContractActive("token");
  console.log(`💰 Token actif: ${isTokenActive}`);

  const tokenAddress = await connector.getContractAddress("token");
  console.log(`💰 Adresse Token: ${tokenAddress}`);

  // 4. Lister tous les contrats connectés
  console.log("\n📊 TOUS LES CONTRATS CONNECTÉS:");
  const [types, addresses, enabled] = await connector.getAllConnectedContracts();

  for (let i = 0; i < types.length; i++) {
    if (addresses[i] !== ethers.ZeroAddress) {
      console.log(`${types[i]}: ${addresses[i]} (${enabled[i] ? 'Actif' : 'Inactif'})`);
    }
  }

  console.log("\n🎯 PRÊT POUR ÉTENDRE LE SYSTÈME !");
  console.log("Vous pouvez maintenant connecter de nouveaux contrats sans toucher aux existants.");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});