import { ethers } from "hardhat";

async function main() {
  console.log("🔍 VÉRIFICATION CONTRAT SUR BSCSCAN");
  console.log("===================================");

  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  console.log(`📍 Adresse contrat swap: ${SWAP_ADDRESS}`);
  console.log(`🪙 Adresse token CVTC: ${CVTC_TOKEN_ADDRESS}`);

  console.log("\\n📋 INSTRUCTIONS POUR VÉRIFICATION BSCSCAN:");
  console.log("==========================================");

  console.log("\\n1️⃣ ALLER SUR BSCSCAN TESTNET:");
  console.log(`🌐 https://testnet.bscscan.com/address/${SWAP_ADDRESS}#code`);

  console.log("\\n2️⃣ CLIQUER 'VERIFY AND PUBLISH':");
  console.log("   - Sélectionner 'Solidity (Single file)'");
  console.log("   - Compiler version: v0.8.0+commit.c7dfd78e");

  console.log("\\n3️⃣ COLLER LE CODE SOURCE:");
  console.log("   - Ouvrir le fichier: smart-contracts/contracts/CVTCSwap.sol");
  console.log("   - Copier tout le contenu");
  console.log("   - Coller dans 'Enter the Solidity Contract Code below'");

  console.log("\\n4️⃣ PARAMÈTRES DE CONSTRUCCION:");
  console.log("   - Contract Name: CVTCSwap");
  console.log("   - Include Nightly Builds: No");
  console.log("   - Compiler: v0.8.0+commit.c7dfd78e");
  console.log("   - Optimization: Yes");
  console.log("   - Runs: 200");

  console.log("\\n5️⃣ ARGUMENTS DU CONSTRUCTEUR:");
  console.log("   - Constructor Arguments (ABI-encoded):");
  console.log(`   ${CVTC_TOKEN_ADDRESS}`);

  console.log("\\n6️⃣ VÉRIFIER:");
  console.log("   - Cliquer 'Verify and Publish'");
  console.log("   - Attendre la confirmation");

  console.log("\\n🎯 APRÈS VÉRIFICATION:");
  console.log("=====================");
  console.log("✅ Les fonctions seront visibles dans l'onglet 'Write Contract'");
  console.log("✅ Vous pourrez appeler emergencyInitialize() ou autres fonctions");
  console.log("✅ Initialisation du ratio 0.00002/2.5B possible");

  console.log("\\n🔧 COMMANDES HARDHAT ALTERNATIVES:");
  console.log("==================================");

  console.log("\\nSi vous préférez utiliser Hardhat:");
  console.log("1. Installer hardhat-etherscan:");
  console.log(`npm install --save-dev @nomiclabs/hardhat-etherscan`);

  console.log("\\n2. Configurer hardhat.config.ts:");
  console.log(`// Ajouter dans hardhat.config.ts
etherscan: {
  apiKey: process.env.BSCSCAN_API_KEY
}`);

  console.log("\\n3. Vérifier via Hardhat:");
  console.log(`npx hardhat verify --network bscTestnet ${SWAP_ADDRESS} ${CVTC_TOKEN_ADDRESS}`);

  console.log("\\n🚀 PRÊT POUR L'INITIALISATION FINALE!");
  console.log("=====================================");
  console.log("Une fois vérifié, nous pourrons:");
  console.log("✅ Voir toutes les fonctions du contrat");
  console.log("✅ Appeler emergencyInitialize()");
  console.log("✅ Atteindre le ratio exact 0.00002/2.5B");
  console.log("✅ Lancer l'onboarding avec volatilité maximale");
}

main().catch(console.error);