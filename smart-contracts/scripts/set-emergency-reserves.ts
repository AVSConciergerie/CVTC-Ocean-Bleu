import { ethers } from "hardhat";

async function main() {
  console.log("🔧 AJUSTEMENT RÉSERVES D'URGENCE");
  console.log("================================");

  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";

  // Réserves cibles pour ratio 1 BNB = 125,000,000,000,000 CVTC
  const TARGET_BNB_RESERVE = ethers.parseEther("0.00002"); // 0.00002 BNB
  const TARGET_CVTC_RESERVE = ethers.parseUnits("2500000000", 2); // 2.5 milliards CVTC

  console.log(`📍 Contrat: ${SWAP_ADDRESS}`);
  console.log(`🎯 Réserves cibles:`);
  console.log(`   BNB: ${ethers.formatEther(TARGET_BNB_RESERVE)} BNB`);
  console.log(`   CVTC: ${ethers.formatUnits(TARGET_CVTC_RESERVE, 2)} CVTC`);

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  try {
    // Vérifier l'état avant
    const [bnbReserveBefore, cvtcReserveBefore] = await swapContract.getReserves();
    console.log(`\\n📊 État avant:`);
    console.log(`   BNB: ${ethers.formatEther(bnbReserveBefore)} BNB`);
    console.log(`   CVTC: ${ethers.formatUnits(cvtcReserveBefore, 2)} CVTC`);

    // Calculer le ratio avant
    if (bnbReserveBefore > 0) {
      const ratioBefore = Number(ethers.formatUnits(cvtcReserveBefore, 2)) / Number(ethers.formatEther(bnbReserveBefore));
      console.log(`   Ratio: 1 BNB = ${ratioBefore.toLocaleString()} CVTC`);
    }

    // Appeler emergencySetReserves
    console.log(`\\n🔧 Appel emergencySetReserves...`);
    const tx = await swapContract.emergencySetReserves(TARGET_BNB_RESERVE, TARGET_CVTC_RESERVE);
    await tx.wait();

    console.log(`✅ emergencySetReserves réussi - Hash: ${tx.hash}`);

    // Vérifier l'état après
    const [bnbReserveAfter, cvtcReserveAfter] = await swapContract.getReserves();
    console.log(`\\n📊 État après:`);
    console.log(`   BNB: ${ethers.formatEther(bnbReserveAfter)} BNB`);
    console.log(`   CVTC: ${ethers.formatUnits(cvtcReserveAfter, 2)} CVTC`);

    // Calculer le ratio après
    if (bnbReserveAfter > 0) {
      const ratioAfter = Number(ethers.formatUnits(cvtcReserveAfter, 2)) / Number(ethers.formatEther(bnbReserveAfter));
      console.log(`   Ratio: 1 BNB = ${ratioAfter.toLocaleString()} CVTC`);

      const expectedRatio = 125000000000000;
      console.log(`\\n🎯 Ratio attendu: 1 BNB = ${expectedRatio.toLocaleString()} CVTC`);

      if (Math.abs(ratioAfter - expectedRatio) < 1000000) {
        console.log(`✅ Ratio correct !`);
      } else {
        console.log(`⚠️ Ratio légèrement différent`);
      }
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);