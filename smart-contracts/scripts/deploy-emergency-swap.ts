import { ethers } from "hardhat";

async function main() {
  console.log("🚨 DÉPLOIEMENT CONTRAT D'URGENCE");
  console.log("===============================");

  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const OLD_SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // Déployer le nouveau contrat
  console.log("📦 Déploiement CVTCSwapEmergency...");
  const CVTCSwapEmergency = await ethers.getContractFactory("CVTCSwapEmergency");
  const emergencySwap = await CVTCSwapEmergency.deploy(CVTC_TOKEN_ADDRESS);
  await emergencySwap.waitForDeployment();

  const newSwapAddress = await emergencySwap.getAddress();
  console.log(`✅ Nouveau contrat déployé: ${newSwapAddress}`);

  // Transférer les tokens de l'ancien vers le nouveau contrat
  console.log("🔄 Transfert des tokens CVTC...");
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);

  const oldContractBalance = await cvtcToken.balanceOf(OLD_SWAP_ADDRESS);
  console.log(`🏦 Tokens dans l'ancien contrat: ${ethers.formatUnits(oldContractBalance, 2)} CVTC`);

  if (oldContractBalance > 0n) {
    // Note: Cette partie nécessite que l'ancien contrat ait une fonction de retrait d'urgence
    // Pour l'instant, on suppose que les tokens sont transférables
    console.log("⚠️ Les tokens sont bloqués dans l'ancien contrat");
    console.log("💡 Il faudra ajouter une fonction de retrait d'urgence à l'ancien contrat");
  }

  // Mint des tokens directement dans le nouveau contrat (solution temporaire)
  console.log("🪙 Mint de tokens dans le nouveau contrat...");
  const mintAmount = ethers.parseUnits("2500000000", 2); // 2.5 milliards
  const mintTx = await cvtcToken.mint(newSwapAddress, mintAmount);
  await mintTx.wait();
  console.log(`✅ ${ethers.formatUnits(mintAmount, 2)} CVTC mintés dans le nouveau contrat`);

  // Initialiser d'urgence le nouveau contrat
  console.log("🚨 Initialisation d'urgence...");
  const initTx = await emergencySwap.emergencyInitialize();
  await initTx.wait();
  console.log("✅ Nouveau contrat initialisé avec les tokens existants");

  // Vérifier l'état
  const [bnbReserve, cvtcReserve] = await emergencySwap.getReserves();
  console.log(`\\n📊 ÉTAT DU NOUVEAU CONTRAT:`);
  console.log(`💰 BNB: ${ethers.formatEther(bnbReserve)}`);
  console.log(`🪙 CVTC: ${ethers.formatUnits(cvtcReserve, 2)}`);

  console.log(`\\n🎯 PROCHAINES ÉTAPES:`);
  console.log(`1. Mettre à jour l'adresse dans le backend: ${newSwapAddress}`);
  console.log(`2. Ajouter des BNB avec addInitialBnb()`);
  console.log(`3. Tester les swaps`);

  // Sauvegarder l'adresse pour le backend
  console.log(`\\n📝 NOUVELLE ADRESSE SWAP: ${newSwapAddress}`);
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});