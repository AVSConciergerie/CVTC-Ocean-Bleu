import { ethers } from "hardhat";

async function main() {
  console.log("💸 TRANSFERT BNB VERS CONTRAT SWAP");
  console.log("===================================");

  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // Vérifier le solde BNB du deployer
  const bnbBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Solde BNB deployer: ${ethers.formatEther(bnbBalance)} BNB`);

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);

  // Vérifier l'état actuel du contrat
  console.log("\\n📊 ÉTAT ACTUEL CONTRAT:");
  const contractBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
  const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
  console.log(`🏦 CVTC dans contrat: ${ethers.formatUnits(contractBalance, 2)}`);
  console.log(`💰 BNB réserve: ${ethers.formatEther(bnbReserve)}`);
  console.log(`🪙 CVTC réserve: ${ethers.formatUnits(cvtcReserve, 2)}`);

  // Transférer 0.00002 BNB vers le contrat swap
  const transferAmount = ethers.parseEther("0.00002");
  console.log(`\\n💸 TRANSFERT: ${ethers.formatEther(transferAmount)} BNB vers ${SWAP_ADDRESS}`);

  if (bnbBalance < transferAmount) {
    console.log(`❌ Solde insuffisant: ${ethers.formatEther(bnbBalance)} < ${ethers.formatEther(transferAmount)}`);
    return;
  }

  try {
    const transferTx = await deployer.sendTransaction({
      to: SWAP_ADDRESS,
      value: transferAmount
    });
    await transferTx.wait();
    console.log("✅ BNB transféré vers le contrat swap!");
    console.log(`📋 Hash: ${transferTx.hash}`);

    // Vérifier après transfert
    const [bnbAfter, cvtcAfter] = await swapContract.getReserves();
    console.log(`\\n📊 APRÈS TRANSFERT:`);
    console.log(`💰 BNB réserve: ${ethers.formatEther(bnbAfter)}`);
    console.log(`🪙 CVTC réserve: ${ethers.formatUnits(cvtcAfter, 2)}`);

    // Maintenant nous avons BNB dans le contrat mais CVTC réserve = 0
    // Il faut initialiser la réserve CVTC manuellement
    if (bnbAfter >= transferAmount && cvtcAfter == 0n && contractBalance > 0n) {
      console.log("\\n🪙 INITIALISATION RÉSERVE CVTC...");

      // Méthode 1: Essayer emergencyInitialize maintenant que nous avons BNB
      try {
        const emergencyTx = await swapContract.emergencyInitialize();
        await emergencyTx.wait();
        console.log("✅ Emergency initialize réussi!");
        console.log(`📋 Hash: ${emergencyTx.hash}`);
      } catch (error) {
        console.log("❌ Emergency initialize échoue:", error.message);

        // Méthode 2: Puisque emergencyInitialize échoue, nous devons trouver une autre solution
        console.log("\\n🔧 SOLUTIONS ALTERNATIVES:");

        // Option A: Modifier le contrat pour ajouter une fonction d'initialisation manuelle
        console.log("💡 Option A: Ajouter fonction setCvtcReserve() au contrat existant");
        console.log("💡 Option B: Créer nouveau contrat et migrer les tokens");

        // Pour l'instant, créons un résumé de l'état
        console.log("\\n📋 RÉSUMÉ ÉTAT ACTUEL:");
        console.log("=======================");
        console.log(`✅ BNB dans contrat: ${ethers.formatEther(bnbAfter)}`);
        console.log(`❌ CVTC réserve: ${ethers.formatUnits(cvtcAfter, 2)} (devrait être ${ethers.formatUnits(contractBalance, 2)})`);
        console.log(`✅ CVTC dans contrat: ${ethers.formatUnits(contractBalance, 2)}`);
        console.log("\\n🎯 OBJECTIF:");
        console.log(`• BNB réserve: ${ethers.formatEther(bnbAfter)}`);
        console.log(`• CVTC réserve: ${ethers.formatUnits(contractBalance, 2)}`);
        console.log(`• Ratio: 1 BNB = ${(Number(ethers.formatUnits(contractBalance, 2)) / Number(ethers.formatEther(bnbAfter))).toLocaleString()} CVTC`);
      }

      // Vérification finale
      const [finalBnb, finalCvtc] = await swapContract.getReserves();
      console.log(`\\n🎯 ÉTAT FINAL:`);
      console.log(`💰 BNB: ${ethers.formatEther(finalBnb)}`);
      console.log(`🪙 CVTC: ${ethers.formatUnits(finalCvtc, 2)}`);

      if (finalBnb > 0n && finalCvtc > 0n) {
        console.log("\\n🎉 POOL INITIALISÉ AVEC SUCCÈS!");
        console.log("================================");
        console.log("✅ Ratio anti-baleine activé");
        console.log("✅ Volatilité maximale");
        console.log("🚀 Prêt pour l'onboarding!");
      } else {
        console.log("\\n⚠️ RÉSERVE CVTC PAS INITIALISÉE");
        console.log("🔧 Action manuelle requise pour définir cvtcReserve");
      }
    }

  } catch (error) {
    console.log("❌ Transfert échoue:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});