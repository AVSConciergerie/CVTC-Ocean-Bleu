import { ethers } from "hardhat";

async function main() {
  console.log("💱 EXÉCUTION SWAP UTILISATEUR");
  console.log("============================");

  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";
  const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  // Test avec un petit montant BNB d'abord
  const BNB_AMOUNT = ethers.parseEther("0.000001"); // 0.000001 BNB pour test
  const TARGET_CVTC = ethers.parseUnits("2500000000", 2); // 2.5 milliards CVTC
  const MIN_CVTC_OUT = ethers.parseUnits("60000000", 2); // Minimum 60 millions pour test

  console.log(`👤 Utilisateur: ${USER_ADDRESS}`);
  console.log(`💰 BNB à envoyer: ${ethers.formatEther(BNB_AMOUNT)} BNB`);
  console.log(`🎯 CVTC cible: ${ethers.formatUnits(TARGET_CVTC, 2)} CVTC`);
  console.log(`🛡️ Minimum CVTC: ${ethers.formatUnits(MIN_CVTC_OUT, 2)} CVTC`);

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  try {
    // Vérifier le solde utilisateur avant
    const balanceBefore = await cvtcToken.balanceOf(USER_ADDRESS);
    console.log(`\\n💰 Solde utilisateur avant: ${ethers.formatUnits(balanceBefore, 2)} CVTC`);

    // Vérifier les réserves avant
    const [bnbReserveBefore, cvtcReserveBefore] = await swapContract.getReserves();
    console.log(`📊 Réserves avant:`);
    console.log(`   BNB: ${ethers.formatEther(bnbReserveBefore)} BNB`);
    console.log(`   CVTC: ${ethers.formatUnits(cvtcReserveBefore, 2)} CVTC`);

    // Calculer le montant CVTC attendu
    const amountInWithFee = BNB_AMOUNT * BigInt(997); // 0.3% fee
    const numerator = amountInWithFee * cvtcReserveBefore;
    const denominator = bnbReserveBefore * BigInt(1000) + amountInWithFee;
    const expectedCvtc = numerator / denominator;

    console.log(`\\n🧮 Calcul swap:`);
    console.log(`   CVTC attendu: ${ethers.formatUnits(expectedCvtc, 2)} CVTC`);

    // Exécuter le swap
    console.log(`\\n🔄 Exécution du swap...`);
    const tx = await swapContract.buyForUser(USER_ADDRESS, MIN_CVTC_OUT, {
      value: BNB_AMOUNT
    });
    await tx.wait();

    console.log(`✅ Swap réussi - Hash: ${tx.hash}`);

    // Vérifier le solde utilisateur après
    const balanceAfter = await cvtcToken.balanceOf(USER_ADDRESS);
    console.log(`\\n💰 Solde utilisateur après: ${ethers.formatUnits(balanceAfter, 2)} CVTC`);

    const received = balanceAfter - balanceBefore;
    console.log(`📈 CVTC reçus: ${ethers.formatUnits(received, 2)} CVTC`);

    // Vérifier les réserves après
    const [bnbReserveAfter, cvtcReserveAfter] = await swapContract.getReserves();
    console.log(`\\n📊 Réserves après:`);
    console.log(`   BNB: ${ethers.formatEther(bnbReserveAfter)} BNB`);
    console.log(`   CVTC: ${ethers.formatUnits(cvtcReserveAfter, 2)} CVTC`);

    // Vérifier si l'objectif est atteint
    if (balanceAfter >= TARGET_CVTC) {
      console.log(`\\n🎉 OBJECTIF ATTEINT !`);
      console.log(`L'utilisateur a maintenant ${ethers.formatUnits(balanceAfter, 2)} CVTC`);
    } else {
      const remaining = TARGET_CVTC - balanceAfter;
      console.log(`\\n⚠️ OBJECTIF PARTIELLEMENT ATTEINT`);
      console.log(`Il reste ${ethers.formatUnits(remaining, 2)} CVTC à obtenir`);
    }

  } catch (error) {
    console.log("❌ Erreur lors du swap:", error.message);
  }
}

main().catch(console.error);