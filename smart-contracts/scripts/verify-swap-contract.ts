import { ethers } from "hardhat";

async function main() {
  console.log("🔍 VÉRIFICATION CONTRAT SWAP COMPLET");
  console.log("====================================");

  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  try {
    console.log(`📍 Contrat: ${SWAP_ADDRESS}`);

    // Vérifier les fonctions disponibles
    console.log(`\\n🔧 FONCTIONS DISPONIBLES:`);

    // Vérifier buy (classique)
    try {
      const buySelector = swapContract.interface.getFunction("buy");
      console.log(`✅ buy(uint256 minCvtcOut) - Présente`);
    } catch (e) {
      console.log(`❌ buy() - Non trouvée`);
    }

    // Vérifier buyForUser (nouvelle fonction)
    try {
      const buyForUserSelector = swapContract.interface.getFunction("buyForUser");
      console.log(`✅ buyForUser(address user, uint256 minCvtcOut) - Présente`);
    } catch (e) {
      console.log(`❌ buyForUser() - Non trouvée`);
    }

    // Vérifier les autres fonctions importantes
    const functions = [
      "getReserves",
      "cvtcToken",
      "toggleLiquidity",
      "updateWhitelist",
      "emergencySetReserves"
    ];

    for (const func of functions) {
      try {
        const selector = swapContract.interface.getFunction(func);
        console.log(`✅ ${func}() - Présente`);
      } catch (e) {
        console.log(`❌ ${func}() - Non trouvée`);
      }
    }

    // Vérifier l'état du contrat
    console.log(`\\n⚙️ ÉTAT CONTRAT:`);
    const liquidityEnabled = await swapContract.liquidityEnabled();
    const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
    const owner = await swapContract.owner();

    console.log(`🔄 Liquidité activée: ${liquidityEnabled}`);
    console.log(`👑 Owner: ${owner}`);
    console.log(`💰 Réserves BNB: ${ethers.formatEther(bnbReserve)} BNB`);
    console.log(`🪙 Réserves CVTC: ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);

    // Vérifier l'adresse du token
    const cvtcTokenAddress = await swapContract.cvtcToken();
    console.log(`🪙 Token CVTC: ${cvtcTokenAddress}`);

    // Calculer le ratio actuel
    if (bnbReserve > 0 && cvtcReserve > 0) {
      const ratio = Number(ethers.formatUnits(cvtcReserve, 2)) / Number(ethers.formatEther(bnbReserve));
      console.log(`\\n📈 RATIO ACTUEL:`);
      console.log(`1 BNB = ${ratio.toLocaleString()} CVTC`);

      const expectedRatio = 125000000000000; // 125 trillions
      console.log(`🎯 RATIO ATTENDU: 1 BNB = ${expectedRatio.toLocaleString()} CVTC`);

      if (Math.abs(ratio - expectedRatio) < 1000000) {
        console.log(`✅ Ratio correct`);
      } else {
        console.log(`❌ Ratio incorrect - Écart: ${(expectedRatio - ratio).toLocaleString()}`);
      }
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);