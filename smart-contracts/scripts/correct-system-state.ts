import { ethers } from "hardhat";

async function main() {
  console.log("🔧 CORRECTION ÉTAT SYSTÈME");
  console.log("==========================");

  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";
  const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  try {
    console.log(`📍 Contrat: ${SWAP_ADDRESS}`);
    console.log(`👤 Utilisateur: ${USER_ADDRESS}`);

    // ÉTAPE 1: Vérifier l'état actuel
    console.log(`\\n📊 ÉTAPE 1: ÉTAT ACTUEL`);

    const [currentBnbReserve, currentCvtcReserve] = await swapContract.getReserves();
    const contractCvtcBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
    const contractBnbBalance = await ethers.provider.getBalance(SWAP_ADDRESS);
    const userBalance = await cvtcToken.balanceOf(USER_ADDRESS);

    console.log(`💰 Réserves actuelles:`);
    console.log(`   BNB: ${ethers.formatEther(currentBnbReserve)} BNB`);
    console.log(`   CVTC: ${ethers.formatUnits(currentCvtcReserve, 2)} CVTC`);
    console.log(`💰 Soldes contrat:`);
    console.log(`   BNB: ${ethers.formatEther(contractBnbBalance)} BNB`);
    console.log(`   CVTC: ${ethers.formatUnits(contractCvtcBalance, 2)} CVTC`);
    console.log(`👤 Solde utilisateur: ${ethers.formatUnits(userBalance, 2)} CVTC`);

    // ÉTAPE 2: Calculer les corrections nécessaires
    console.log(`\\n🧮 ÉTAPE 2: CALCULS DE CORRECTION`);

    const TARGET_BNB_RESERVE = ethers.parseEther("0.00002");
    const TARGET_CVTC_RESERVE = ethers.parseUnits("2500000000", 2);

    console.log(`🎯 Réserves cibles:`);
    console.log(`   BNB: ${ethers.formatEther(TARGET_BNB_RESERVE)} BNB`);
    console.log(`   CVTC: ${ethers.formatUnits(TARGET_CVTC_RESERVE, 2)} CVTC`);

    const bnbDifference = TARGET_BNB_RESERVE - currentBnbReserve;
    const cvtcDifference = TARGET_CVTC_RESERVE - currentCvtcReserve;

    console.log(`⚖️ Ajustements nécessaires:`);
    console.log(`   BNB: ${ethers.formatEther(bnbDifference)} BNB`);
    console.log(`   CVTC: ${ethers.formatUnits(cvtcDifference, 2)} CVTC`);

    // ÉTAPE 3: Vérifier les fonds disponibles
    console.log(`\\n💰 ÉTAPE 3: VÉRIFICATION FONDS`);

    const signer = await ethers.getSigners();
    const signerBnbBalance = await ethers.provider.getBalance(signer[0].address);
    const signerCvtcBalance = await cvtcToken.balanceOf(signer[0].address);

    console.log(`🏦 Fonds disponibles:`);
    console.log(`   BNB: ${ethers.formatEther(signerBnbBalance)} BNB`);
    console.log(`   CVTC: ${ethers.formatUnits(signerCvtcBalance, 2)} CVTC`);

    // ÉTAPE 4: Exécuter les corrections
    console.log(`\\n🔧 ÉTAPE 4: EXÉCUTION CORRECTIONS`);

    // 4.1 Ajuster les réserves BNB si nécessaire
    if (bnbDifference !== 0n) {
      if (bnbDifference > 0) {
        console.log(`💸 Ajout de ${ethers.formatEther(bnbDifference)} BNB au contrat...`);
        const tx = await signer[0].sendTransaction({
          to: SWAP_ADDRESS,
          value: bnbDifference
        });
        await tx.wait();
        console.log(`✅ BNB ajouté - Hash: ${tx.hash}`);
      } else {
        console.log(`⚠️ Trop de BNB dans les réserves - Ajustement manuel nécessaire`);
      }
    }

    // 4.2 Ajuster les réserves CVTC si nécessaire
    if (cvtcDifference !== 0n) {
      if (cvtcDifference > 0) {
        console.log(`🪙 Ajustement des réserves CVTC nécessaire...`);
        console.log(`⚠️ Nécessite transfert de ${ethers.formatUnits(cvtcDifference, 2)} CVTC vers le contrat`);
        console.log(`💡 Utiliser emergencySetReserves après transfert`);
      } else {
        console.log(`⚠️ Trop de CVTC dans les réserves - Ajustement manuel nécessaire`);
      }
    }

    // ÉTAPE 5: Vérifier l'état après correction
    console.log(`\\n🔍 ÉTAPE 5: VÉRIFICATION FINALE`);

    const [finalBnbReserve, finalCvtcReserve] = await swapContract.getReserves();
    const finalContractBnb = await ethers.provider.getBalance(SWAP_ADDRESS);
    const finalContractCvtc = await cvtcToken.balanceOf(SWAP_ADDRESS);

    console.log(`💰 État final:`);
    console.log(`   Réserves BNB: ${ethers.formatEther(finalBnbReserve)} BNB`);
    console.log(`   Réserves CVTC: ${ethers.formatUnits(finalCvtcReserve, 2)} CVTC`);
    console.log(`   Contrat BNB: ${ethers.formatEther(finalContractBnb)} BNB`);
    console.log(`   Contrat CVTC: ${ethers.formatUnits(finalContractCvtc, 2)} CVTC`);

    // Calcul du ratio final
    if (finalBnbReserve > 0 && finalCvtcReserve > 0) {
      const finalRatio = Number(ethers.formatUnits(finalCvtcReserve, 2)) / Number(ethers.formatEther(finalBnbReserve));
      console.log(`\\n📈 Ratio final: 1 BNB = ${finalRatio.toLocaleString()} CVTC`);

      const expectedRatio = 125000000000000;
      if (Math.abs(finalRatio - expectedRatio) < 1000000) {
        console.log(`✅ Ratio correct - Système prêt`);
      } else {
        console.log(`⚠️ Ratio encore à ajuster`);
      }
    }

    // ÉTAPE 6: Instructions pour finaliser
    console.log(`\\n📋 PROCHAINES ÉTAPES:`);
    console.log(`===================`);

    if (cvtcDifference > 0) {
      console.log(`1. 📤 Transférer ${ethers.formatUnits(cvtcDifference, 2)} CVTC vers ${SWAP_ADDRESS}`);
      console.log(`2. 🔧 Appeler emergencySetReserves(${TARGET_BNB_RESERVE}, ${TARGET_CVTC_RESERVE})`);
      console.log(`3. 🎯 Tester un swap pour vérifier le ratio`);
    }

    console.log(`4. 🔄 Synchroniser le backend avec la blockchain`);
    console.log(`5. ✅ Tester le système complet`);

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);