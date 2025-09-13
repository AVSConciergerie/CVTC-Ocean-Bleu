import { ethers } from "hardhat";

async function main() {
  console.log("💰 RETRAIT LIQUIDITÉ");
  console.log("====================");

  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  try {
    // Vérifier les réserves actuelles
    const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
    const contractBnbBalance = await ethers.provider.getBalance(SWAP_ADDRESS);
    const contractCvtcBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);

    console.log(`📊 Réserves actuelles:`);
    console.log(`   BNB: ${ethers.formatEther(bnbReserve)} BNB`);
    console.log(`   CVTC: ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);
    console.log(`💰 Balances contrat:`);
    console.log(`   BNB: ${ethers.formatEther(contractBnbBalance)} BNB`);
    console.log(`   CVTC: ${ethers.formatUnits(contractCvtcBalance, 2)} CVTC`);

    // Retirer toute la liquidité
    const bnbAmount = bnbReserve;
    const cvtcAmount = cvtcReserve;

    console.log(`\\n🔄 Retrait liquidité:`);
    console.log(`   BNB: ${ethers.formatEther(bnbAmount)} BNB`);
    console.log(`   CVTC: ${ethers.formatUnits(cvtcAmount, 2)} CVTC`);

    // Appeler removeLiquidity
    console.log(`\\n🔧 Appel removeLiquidity...`);
    const tx = await swapContract.removeLiquidity(bnbAmount, cvtcAmount);
    await tx.wait();

    console.log(`✅ Retrait réussi - Hash: ${tx.hash}`);

    // Vérifier après retrait
    const [bnbReserveAfter, cvtcReserveAfter] = await swapContract.getReserves();
    const signerCvtcBalance = await cvtcToken.balanceOf(await ethers.getSigners().then(s => s[0].address));

    console.log(`\\n📊 Après retrait:`);
    console.log(`   Réserves BNB: ${ethers.formatEther(bnbReserveAfter)} BNB`);
    console.log(`   Réserves CVTC: ${ethers.formatUnits(cvtcReserveAfter, 2)} CVTC`);
    console.log(`   CVTC signer: ${ethers.formatUnits(signerCvtcBalance, 2)} CVTC`);

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);