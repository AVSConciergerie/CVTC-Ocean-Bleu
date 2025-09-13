import { ethers } from "hardhat";

async function main() {
  console.log("🔧 CORRECTION RÉSERVES - CONFIGURATION FINALE");
  console.log("=============================================");

  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);

  // État actuel
  console.log("\\n📊 ÉTAT ACTUEL:");
  const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
  const contractCvtcBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
  const contractBnbBalance = await ethers.provider.getBalance(SWAP_ADDRESS);

  console.log(`💰 BNB réserve: ${ethers.formatEther(bnbReserve)}`);
  console.log(`🪙 CVTC réserve: ${ethers.formatUnits(cvtcReserve, 2)}`);
  console.log(`🏦 CVTC dans contrat: ${ethers.formatUnits(contractCvtcBalance, 2)}`);
  console.log(`💰 BNB dans contrat: ${ethers.formatEther(contractBnbBalance)}`);

  // Objectif : 0.00002 BNB / 2.5 milliards CVTC
  const targetBnb = ethers.parseEther("0.00002");
  const targetCvtc = ethers.parseUnits("2500000000", 2);

  console.log(`\\n🎯 OBJECTIF:`);
  console.log(`💰 BNB cible: ${ethers.formatEther(targetBnb)}`);
  console.log(`🪙 CVTC cible: ${ethers.formatUnits(targetCvtc, 2)}`);

  const targetRatio = Number(ethers.formatUnits(targetCvtc, 2)) / Number(ethers.formatEther(targetBnb));
  console.log(`📈 Ratio cible: 1 BNB = ${targetRatio.toLocaleString()} CVTC`);

  // Vérifier si nous avons les bonnes quantités
  const hasCorrectBnb = contractBnbBalance >= targetBnb;
  const hasCorrectCvtc = contractCvtcBalance >= targetCvtc;

  console.log(`\\n✅ VÉRIFICATIONS:`);
  console.log(`BNB suffisant: ${hasCorrectBnb ? '✅' : '❌'} (${ethers.formatEther(contractBnbBalance)} >= ${ethers.formatEther(targetBnb)})`);
  console.log(`CVTC suffisant: ${hasCorrectCvtc ? '✅' : '❌'} (${ethers.formatUnits(contractCvtcBalance, 2)} >= ${ethers.formatUnits(targetCvtc, 2)})`);

  if (hasCorrectBnb && hasCorrectCvtc) {
    console.log("\\n🎯 CONFIGURATION PARFAITE DISPONIBLE!");

    // Méthode 1: Reset et réinitialisation
    console.log("\\n🔄 MÉTHODE 1: RESET COMPLET");
    try {
      // Cette méthode nécessiterait une fonction reset() dans le contrat
      console.log("⚠️ Nécessite fonction reset() dans le contrat");
    } catch (error) {
      console.log("❌ Reset impossible");
    }

    // Méthode 2: Ajustement manuel des réserves
    console.log("\\n🛠️ MÉTHODE 2: AJUSTEMENT MANUEL");

    // Calculer les ajustements nécessaires
    const bnbAdjustment = targetBnb - bnbReserve;
    const cvtcAdjustment = targetCvtc - cvtcReserve;

    console.log(`Ajustement BNB: ${bnbAdjustment >= 0n ? '+' : ''}${ethers.formatEther(bnbAdjustment)}`);
    console.log(`Ajustement CVTC: ${cvtcAdjustment >= 0n ? '+' : ''}${ethers.formatUnits(cvtcAdjustment, 2)}`);

    // Proposition: Utiliser l'explorateur BSC Testnet
    console.log("\\n🌐 SOLUTION VIA EXPLORATEUR BSC TESTNET:");
    console.log("=====================================");
    console.log(`1. Aller sur: https://testnet.bscscan.com/address/${SWAP_ADDRESS}#writeContract`);
    console.log("2. Connecter votre wallet");
    console.log("3. Trouver la fonction 'emergencySetReserves' (si elle existe)");
    console.log("4. Paramètres:");
    console.log(`   - _bnbReserve: ${targetBnb.toString()}`);
    console.log(`   - _cvtcReserve: ${targetCvtc.toString()}`);
    console.log("5. Exécuter la transaction");

    // Alternative: Créer une fonction temporaire
    console.log("\\n🔧 ALTERNATIVE: FONCTION TEMPORAIRE");
    console.log("Si emergencySetReserves n'existe pas, il faudrait:");
    console.log("1. Modifier le contrat source");
    console.log("2. Redéployer");
    console.log("3. Ou utiliser une fonction existante");

    // Vérification finale
    console.log("\\n📋 RÉSUMÉ:");
    console.log("==========");
    console.log(`✅ Adresse: ${SWAP_ADDRESS}`);
    console.log(`✅ BNB disponible: ${ethers.formatEther(contractBnbBalance)}`);
    console.log(`✅ CVTC disponible: ${ethers.formatUnits(contractCvtcBalance, 2)}`);
    console.log(`🎯 Ratio souhaité: 1 BNB = ${targetRatio.toLocaleString()} CVTC`);
    console.log(`🚀 Prêt pour l'initialisation finale!`);

  } else {
    console.log("\\n⚠️ QUANTITÉS INSUFFISANTES");
    if (!hasCorrectBnb) {
      console.log(`❌ Manque ${ethers.formatEther(targetBnb - contractBnbBalance)} BNB`);
    }
    if (!hasCorrectCvtc) {
      console.log(`❌ Manque ${ethers.formatUnits(targetCvtc - contractCvtcBalance, 2)} CVTC`);
    }
  }
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});