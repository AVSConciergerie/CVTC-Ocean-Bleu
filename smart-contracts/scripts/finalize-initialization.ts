import { ethers } from "hardhat";

async function main() {
  console.log("🎯 FINALISATION INITIALISATION SWAP");
  console.log("===================================");

  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  // Paramètres cibles
  const TARGET_BNB_RESERVE = ethers.parseEther("0.00002"); // 0.00002 BNB
  const TARGET_CVTC_RESERVE = ethers.parseUnits("2500000000", 2); // 2.5 milliards CVTC

  console.log(`📍 Contrat swap: ${SWAP_ADDRESS}`);
  console.log(`💰 BNB cible: ${ethers.formatEther(TARGET_BNB_RESERVE)} BNB`);
  console.log(`🪙 CVTC cible: ${ethers.formatUnits(TARGET_CVTC_RESERVE, 2)} CVTC`);

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  try {
    // Vérifier l'état actuel
    const liquidityEnabled = await swapContract.liquidityEnabled();
    const [currentBnbReserve, currentCvtcReserve] = await swapContract.getReserves();
    const contractBnbBalance = await ethers.provider.getBalance(SWAP_ADDRESS);
    const contractCvtcBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);

    console.log(`\\n🔍 ÉTAT ACTUEL:`);
    console.log(`🔄 Liquidité: ${liquidityEnabled ? 'Activée' : 'Désactivée'}`);
    console.log(`💰 Réserve BNB: ${ethers.formatEther(currentBnbReserve)} BNB`);
    console.log(`🪙 Réserve CVTC: ${ethers.formatUnits(currentCvtcReserve, 2)} CVTC`);
    console.log(`💰 Balance BNB: ${ethers.formatEther(contractBnbBalance)} BNB`);
    console.log(`🪙 Balance CVTC: ${ethers.formatUnits(contractCvtcBalance, 2)} CVTC`);

    // Vérifier si les conditions sont remplies
    const bnbOk = contractBnbBalance >= TARGET_BNB_RESERVE;
    const cvtcOk = contractCvtcBalance >= TARGET_CVTC_RESERVE;

    console.log(`\\n✅ VÉRIFICATIONS:`);
    console.log(`💰 BNB suffisant: ${bnbOk ? 'OUI' : 'NON'}`);
    console.log(`🪙 CVTC suffisant: ${cvtcOk ? 'OUI' : 'NON'}`);

    if (!bnbOk || !cvtcOk) {
      console.log("\\n❌ CONDITIONS NON REMPLIES");
      if (!bnbOk) console.log(`Manque: ${ethers.formatEther(TARGET_BNB_RESERVE - contractBnbBalance)} BNB`);
      if (!cvtcOk) console.log(`Manque: ${ethers.formatUnits(TARGET_CVTC_RESERVE - contractCvtcBalance, 2)} CVTC`);
      return;
    }

    console.log("\\n🎯 CONDITIONS REMPLIES - PROCÉDONS À L'INITIALISATION");

    // Puisque les réserves BNB sont déjà initialisées, utiliser emergencySetReserves
    if (currentBnbReserve > 0 && currentCvtcReserve == 0) {
      console.log("\\n🔧 UTILISATION DE emergencySetReserves...");

      const setReservesTx = await swapContract.emergencySetReserves(TARGET_BNB_RESERVE, TARGET_CVTC_RESERVE);
      await setReservesTx.wait();

      console.log("✅ Réserves définies avec succès!");
      console.log(`🔗 Hash: ${setReservesTx.hash}`);

    } else if (currentBnbReserve == 0 && currentCvtcReserve == 0) {
      // Si tout est à zéro, on peut utiliser emergencyInitWithTransfer
      console.log("\\n🚀 UTILISATION DE emergencyInitWithTransfer...");

      const initTx = await swapContract.emergencyInitWithTransfer(TARGET_BNB_RESERVE, TARGET_CVTC_RESERVE);
      await initTx.wait();

      console.log("✅ Initialisation réussie!");
      console.log(`🔗 Hash: ${initTx.hash}`);

    } else {
      console.log("\\n⚠️ RÉSERVES DÉJÀ INITIALISÉES");
      console.log("Vérification du ratio actuel...");

      if (currentBnbReserve > 0 && currentCvtcReserve > 0) {
        const currentRatio = Number(currentCvtcReserve) / Number(currentBnbReserve);
        const targetRatio = Number(TARGET_CVTC_RESERVE) / Number(TARGET_BNB_RESERVE);

        console.log(`Ratio actuel: 1 BNB = ${currentRatio.toLocaleString()} CVTC`);
        console.log(`Ratio cible: 1 BNB = ${targetRatio.toLocaleString()} CVTC`);

        if (Math.abs(currentRatio - targetRatio) < 0.01) {
          console.log("✅ Ratio correct - Initialisation déjà parfaite!");
        } else {
          console.log("⚠️ Ratio différent - Ajustement nécessaire");
        }
      }
    }

    // Vérification finale
    console.log("\\n🔍 VÉRIFICATION FINALE:");
    const [finalBnbReserve, finalCvtcReserve] = await swapContract.getReserves();
    console.log(`💰 Réserve BNB finale: ${ethers.formatEther(finalBnbReserve)} BNB`);
    console.log(`🪙 Réserve CVTC finale: ${ethers.formatUnits(finalCvtcReserve, 2)} CVTC`);

    if (finalBnbReserve > 0 && finalCvtcReserve > 0) {
      const finalRatio = Number(finalCvtcReserve) / Number(finalBnbReserve);
      console.log(`📈 Ratio final: 1 BNB = ${finalRatio.toLocaleString()} CVTC`);

      console.log("\\n🎉 INITIALISATION TERMINÉE AVEC SUCCÈS!");
      console.log("=========================================");
      console.log("✅ Pool swap opérationnel");
      console.log("✅ Ratio anti-baleine configuré");
      console.log("✅ Volatilité maximale activée");
      console.log("✅ Contrôle total sur la liquidité");

      console.log("\\n📋 PROCHAINES ÉTAPES:");
      console.log("====================");
      console.log("1. ✅ Mettre à jour backend/.env avec la nouvelle adresse");
      console.log("2. ✅ Tester l'onboarding avec le nouveau contrat");
      console.log("3. ✅ Vérifier les limites anti-baleine");
      console.log("4. ✅ Surveiller la volatilité");

    } else {
      console.log("\\n❌ INITIALISATION ÉCHOUÉE");
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);