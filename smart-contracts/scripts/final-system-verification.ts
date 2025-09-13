import { ethers } from "hardhat";

async function main() {
  console.log("🎯 VÉRIFICATION FINALE SYSTÈME");
  console.log("==============================");

  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";
  const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  try {
    console.log("📍 Adresses:");
    console.log(`   Swap: ${SWAP_ADDRESS}`);
    console.log(`   User: ${USER_ADDRESS}`);
    console.log(`   CVTC: ${CVTC_ADDRESS}`);

    // Vérifier l'état du contrat swap
    console.log(`\\n🏢 CONTRAT SWAP:`);
    const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
    const contractBnbBalance = await ethers.provider.getBalance(SWAP_ADDRESS);
    const contractCvtcBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
    const isWhitelisted = await swapContract.whitelisted(USER_ADDRESS);

    console.log(`   Réserves BNB: ${ethers.formatEther(bnbReserve)} BNB`);
    console.log(`   Réserves CVTC: ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);
    console.log(`   Balance BNB: ${ethers.formatEther(contractBnbBalance)} BNB`);
    console.log(`   Balance CVTC: ${ethers.formatUnits(contractCvtcBalance, 2)} CVTC`);
    console.log(`   User whitelisted: ${isWhitelisted}`);

    // Vérifier l'état de l'utilisateur
    console.log(`\\n👤 UTILISATEUR:`);
    const userCvtcBalance = await cvtcToken.balanceOf(USER_ADDRESS);
    console.log(`   Balance CVTC: ${ethers.formatUnits(userCvtcBalance, 2)} CVTC`);

    // Calculs de vérification
    console.log(`\\n🧮 VÉRIFICATIONS:`);
    const expectedBalance = ethers.parseUnits("2500000000", 2);
    const balanceCorrect = userCvtcBalance >= expectedBalance;
    console.log(`   ✅ Balance utilisateur >= 2.5B: ${balanceCorrect}`);

    const reservesEmpty = bnbReserve === 0n && cvtcReserve === 0n;
    console.log(`   ✅ Réserves vidées: ${reservesEmpty}`);

    const contractEmpty = contractCvtcBalance === 0n;
    console.log(`   ✅ Contrat vidé: ${contractEmpty}`);

    // Résumé
    console.log(`\\n📋 RÉSUMÉ:`);
    if (balanceCorrect && reservesEmpty && contractEmpty) {
      console.log(`   🎉 SYSTÈME CORRECT !`);
      console.log(`   • Utilisateur a ${ethers.formatUnits(userCvtcBalance, 2)} CVTC`);
      console.log(`   • Swap contract prêt pour reconfiguration`);
    } else {
      console.log(`   ⚠️ PROBLÈMES DÉTECTÉS:`);
      if (!balanceCorrect) console.log(`     - Balance utilisateur incorrecte`);
      if (!reservesEmpty) console.log(`     - Réserves non vidées`);
      if (!contractEmpty) console.log(`     - Contrat non vidé`);
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);