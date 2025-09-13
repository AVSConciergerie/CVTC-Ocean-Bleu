import { ethers } from "hardhat";

async function main() {
  console.log("🔍 VÉRIFICATION SETUP FINAL");
  console.log("===========================");

  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  try {
    // Vérifier les informations du token
    const tokenName = await cvtcToken.name();
    const tokenSymbol = await cvtcToken.symbol();
    const decimals = await cvtcToken.decimals();
    const totalSupply = await cvtcToken.totalSupply();

    console.log(`\\n🪙 INFORMATIONS TOKEN CVTC:`);
    console.log(`📛 Nom: ${tokenName}`);
    console.log(`🏷️ Symbole: ${tokenSymbol}`);
    console.log(`🔢 Décimales: ${decimals}`);
    console.log(`📊 Total supply: ${ethers.formatUnits(totalSupply, decimals)} CVTC`);

    // Vérifier les réserves actuelles
    const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
    console.log(`\\n💰 RÉSERVES ACTUELLES:`);
    console.log(`💰 BNB: ${ethers.formatEther(bnbReserve)} BNB`);
    console.log(`🪙 CVTC: ${ethers.formatUnits(cvtcReserve, decimals)} CVTC`);

    // Calculer le ratio correctement
    if (bnbReserve > 0 && cvtcReserve > 0) {
      const bnbReserveNum = Number(ethers.formatEther(bnbReserve));
      const cvtcReserveNum = Number(ethers.formatUnits(cvtcReserve, decimals));

      const ratioCvtcPerBnb = cvtcReserveNum / bnbReserveNum;
      const ratioBnbPerCvtc = bnbReserveNum / cvtcReserveNum;

      console.log(`\\n📈 RATIOS CALCULÉS:`);
      console.log(`1 BNB = ${ratioCvtcPerBnb.toLocaleString()} CVTC`);
      console.log(`1 CVTC = ${ratioBnbPerCvtc.toLocaleString()} BNB`);

      // Vérifier si c'est le ratio attendu
      const expectedRatio = 2500000000 / 0.00002; // 125,000,000,000,000
      console.log(`\\n🎯 RATIO ATTENDU: 1 BNB = ${expectedRatio.toLocaleString()} CVTC`);

      if (Math.abs(ratioCvtcPerBnb - expectedRatio) < 1000000) { // Tolérance
        console.log("✅ Ratio correct - Configuration parfaite!");
      } else {
        console.log("⚠️ Ratio différent de l'attendu");
        console.log(`Différence: ${Math.abs(ratioCvtcPerBnb - expectedRatio).toLocaleString()}`);
      }
    }

    // Vérifier les autres paramètres
    const liquidityEnabled = await swapContract.liquidityEnabled();
    const fee = await swapContract.FEE();
    const owner = await swapContract.owner();

    console.log(`\\n⚙️ PARAMÈTRES CONTRAT:`);
    console.log(`🔄 Liquidité activée: ${liquidityEnabled}`);
    console.log(`💸 Frais: ${fee / 10}%`);
    console.log(`👑 Owner: ${owner}`);

    // Tester un calcul d'échange
    console.log(`\\n🧮 TEST CALCUL ÉCHANGE:`);
    const testAmountIn = ethers.parseEther("0.00001"); // 0.00001 BNB
    const amountOut = await swapContract.getAmountOut(testAmountIn, bnbReserve, cvtcReserve);
    console.log(`Échange ${ethers.formatEther(testAmountIn)} BNB → ${ethers.formatUnits(amountOut, decimals)} CVTC`);

    console.log(`\\n🎉 VÉRIFICATION TERMINÉE!`);
    console.log("=========================");

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);