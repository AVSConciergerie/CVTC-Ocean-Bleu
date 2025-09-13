import { ethers } from "hardhat";

async function main() {
  console.log("🔍 INSPECTION CONTRAT DÉPLOYÉ");
  console.log("=============================");

  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  // Test de toutes les fonctions de base
  console.log("\\n📋 FONCTIONS DE BASE:");

  try {
    const owner = await swapContract.owner();
    console.log(`✅ owner(): ${owner}`);
  } catch (error) {
    console.log(`❌ owner(): ${error.message}`);
  }

  try {
    const liquidityEnabled = await swapContract.liquidityEnabled();
    console.log(`✅ liquidityEnabled(): ${liquidityEnabled}`);
  } catch (error) {
    console.log(`❌ liquidityEnabled(): ${error.message}`);
  }

  try {
    const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
    console.log(`✅ getReserves(): BNB=${ethers.formatEther(bnbReserve)}, CVTC=${ethers.formatUnits(cvtcReserve, 2)}`);
  } catch (error) {
    console.log(`❌ getReserves(): ${error.message}`);
  }

  try {
    const cvtcToken = await swapContract.cvtcToken();
    console.log(`✅ cvtcToken(): ${cvtcToken}`);
  } catch (error) {
    console.log(`❌ cvtcToken(): ${error.message}`);
  }

  // Test des fonctions d'initialisation
  console.log("\\n🚀 FONCTIONS D'INITIALISATION:");

  try {
    // Test emergencyInitialize (devrait réussir si conditions remplies)
    const emergencyTx = await swapContract.emergencyInitialize();
    await emergencyTx.wait();
    console.log("✅ emergencyInitialize(): Réussi!");
  } catch (error) {
    console.log(`❌ emergencyInitialize(): ${error.message}`);
  }

  try {
    // Test initializeWithExistingTokens
    const tinyAmount = ethers.parseEther("0.00001");
    const initTx = await swapContract.initializeWithExistingTokens(tinyAmount, {
      value: tinyAmount
    });
    await initTx.wait();
    console.log("✅ initializeWithExistingTokens(): Réussi!");
  } catch (error) {
    console.log(`❌ initializeWithExistingTokens(): ${error.message}`);
  }

  // Vérifier l'état final
  console.log("\\n📊 ÉTAT FINAL:");
  try {
    const [finalBnb, finalCvtc] = await swapContract.getReserves();
    console.log(`💰 BNB: ${ethers.formatEther(finalBnb)}`);
    console.log(`🪙 CVTC: ${ethers.formatUnits(finalCvtc, 2)}`);
  } catch (error) {
    console.log(`❌ État final: ${error.message}`);
  }

  // Test d'une fonction simple pour voir si le contrat répond
  console.log("\\n🧪 TEST SIMPLE:");
  try {
    const toggleTx = await swapContract.toggleLiquidity();
    await toggleTx.wait();
    console.log("✅ toggleLiquidity(): Réussi!");
  } catch (error) {
    console.log(`❌ toggleLiquidity(): ${error.message}`);
  }
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});