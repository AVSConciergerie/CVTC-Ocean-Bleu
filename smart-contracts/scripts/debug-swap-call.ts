import { ethers } from "hardhat";

async function main() {
  console.log("🔧 DEBUG APPEL SWAP");
  console.log("===================");

  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";
  const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  try {
    // Vérifier l'état du contrat
    console.log("📊 État du contrat:");
    const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
    console.log(`   BNB Reserve: ${bnbReserve.toString()} wei (${ethers.formatEther(bnbReserve)} BNB)`);
    console.log(`   CVTC Reserve: ${cvtcReserve.toString()} wei (${ethers.formatUnits(cvtcReserve, 2)} CVTC)`);

    const contractCvtcBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
    console.log(`   CVTC Balance: ${contractCvtcBalance.toString()} wei (${ethers.formatUnits(contractCvtcBalance, 2)} CVTC)`);

    // Paramètres du swap
    const bnbAmount = ethers.parseEther("0.000001");
    const minCvtcOut = ethers.parseUnits("60000000", 2);

    console.log(`\\n🔧 Paramètres swap:`);
    console.log(`   BNB Amount: ${bnbAmount.toString()} wei (${ethers.formatEther(bnbAmount)} BNB)`);
    console.log(`   Min CVTC Out: ${minCvtcOut.toString()} wei (${ethers.formatUnits(minCvtcOut, 2)} CVTC)`);

    // Calcul manuel
    const FEE = 3; // 0.3%
    const amountInWithFee = bnbAmount * BigInt(1000 - FEE) / BigInt(1000);
    const numerator = amountInWithFee * cvtcReserve;
    const denominator = bnbReserve * BigInt(1000) + amountInWithFee;

    console.log(`\\n🧮 Calcul manuel:`);
    console.log(`   AmountInWithFee: ${amountInWithFee.toString()}`);
    console.log(`   Numerator: ${numerator.toString()}`);
    console.log(`   Denominator: ${denominator.toString()}`);

    if (denominator > 0) {
      const cvtcAmount = numerator / denominator;
      console.log(`   CVTC Amount: ${cvtcAmount.toString()} wei (${ethers.formatUnits(cvtcAmount, 2)} CVTC)`);

      console.log(`\\n✅ Vérifications:`);
      console.log(`   CVTC Amount >= Min: ${cvtcAmount >= minCvtcOut}`);
      console.log(`   CVTC Amount <= Reserve: ${cvtcAmount <= cvtcReserve}`);
      console.log(`   BNB Amount > 0: ${bnbAmount > 0}`);
      console.log(`   Reserves > 0: ${bnbReserve > 0 && cvtcReserve > 0}`);
    }

    // Essayer d'estimer le gas
    console.log(`\\n⛽ Estimation gas...`);
    try {
      const gasEstimate = await swapContract.buyForUser.estimateGas(USER_ADDRESS, minCvtcOut, {
        value: bnbAmount
      });
      console.log(`   Gas estimé: ${gasEstimate.toString()}`);
    } catch (estimateError) {
      console.log(`   ❌ Erreur estimation: ${estimateError.message}`);
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);