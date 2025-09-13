import { ethers } from "hardhat";

async function main() {
  console.log("🔓 ACTIVATION LIQUIDITÉ + INITIALISATION ANTI-BALEINE");
  console.log("====================================================");

  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);

  // Étape 1: Activer la liquidité
  console.log("\\n🔓 ÉTAPE 1: Activation de la liquidité...");
  const toggleTx = await swapContract.toggleLiquidity();
  await toggleTx.wait();
  console.log("✅ Liquidité activée!");
  console.log(`📋 Hash: ${toggleTx.hash}`);

  // Vérifier que c'est activé
  const liquidityEnabled = await swapContract.liquidityEnabled();
  console.log(`✅ Statut liquidité: ${liquidityEnabled}`);

  // Étape 2: Vérifier l'état avant initialisation
  console.log("\\n📊 ÉTAPE 2: État avant initialisation...");
  const contractBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
  const [bnbReserveBefore, cvtcReserveBefore] = await swapContract.getReserves();
  console.log(`🏦 CVTC dans contrat: ${ethers.formatUnits(contractBalance, 2)}`);
  console.log(`💰 BNB réserve: ${ethers.formatEther(bnbReserveBefore)}`);
  console.log(`🪙 CVTC réserve: ${ethers.formatUnits(cvtcReserveBefore, 2)}`);

  // Étape 3: Initialisation avec tokens existants
  console.log("\\n🚀 ÉTAPE 3: Initialisation avec tokens existants...");
  const tinyBnbAmount = ethers.parseEther("0.00002");
  console.log(`🎯 Ajout de: ${ethers.formatEther(tinyBnbAmount)} BNB`);

  // Calcul du ratio
  const ratio = Number(ethers.formatUnits(contractBalance, 2)) / Number(ethers.formatEther(tinyBnbAmount));
  console.log(`📈 Ratio final: 1 BNB = ${ratio.toLocaleString()} CVTC`);

  try {
    const initTx = await swapContract.initializeWithExistingTokens(tinyBnbAmount, {
      value: tinyBnbAmount
    });
    await initTx.wait();
    console.log("✅ INITIALISATION RÉUSSIE!");
    console.log(`📋 Hash: ${initTx.hash}`);
  } catch (error) {
    console.log("❌ Échec initialisation:", error.message);
    console.log("💡 Tentative alternative avec emergencyInitialize...");

    // Tentative alternative
    try {
      const emergencyTx = await swapContract.emergencyInitialize();
      await emergencyTx.wait();
      console.log("✅ Emergency initialize réussi!");
      console.log(`📋 Hash: ${emergencyTx.hash}`);

      // Ajouter BNB manuellement
      console.log("\\n💰 Ajout manuel de BNB...");
      const addBnbTx = await deployer.sendTransaction({
        to: SWAP_ADDRESS,
        value: tinyBnbAmount
      });
      await addBnbTx.wait();
      console.log("✅ BNB ajouté manuellement");
      console.log(`📋 Hash: ${addBnbTx.hash}`);

    } catch (emergencyError) {
      console.log("❌ Emergency initialize aussi échoue:", emergencyError.message);
      return;
    }
  }

  // Étape 4: Vérification finale
  console.log("\\n📊 ÉTAPE 4: VÉRIFICATION FINALE...");
  const [bnbReserveAfter, cvtcReserveAfter] = await swapContract.getReserves();
  console.log(`💰 BNB réserve: ${ethers.formatEther(bnbReserveAfter)}`);
  console.log(`🪙 CVTC réserve: ${ethers.formatUnits(cvtcReserveAfter, 2)}`);

  if (bnbReserveAfter > 0n && cvtcReserveAfter > 0n) {
    console.log("\\n🎉 SUCCÈS ! POOL ANTI-BALEINE OPÉRATIONNEL");
    console.log("==========================================");
    console.log("✅ Liquidité activée");
    console.log("✅ Pool initialisé avec ratio extrême");
    console.log("✅ Volatilité maximale activée");
    console.log("🚀 Prêt pour l'onboarding!");

    // Statistiques du pool
    console.log("\\n📈 STATISTIQUES DU POOL:");
    console.log("========================");
    const totalValue = Number(ethers.formatEther(bnbReserveAfter));
    const totalTokens = Number(ethers.formatUnits(cvtcReserveAfter, 2));
    console.log(`• Valeur totale BNB: ${totalValue} BNB`);
    console.log(`• Tokens totaux: ${totalTokens.toLocaleString()} CVTC`);
    console.log(`• Ratio: 1 BNB = ${(totalTokens / totalValue).toLocaleString()} CVTC`);
    console.log(`• Prix spot: 1 CVTC = ${(totalValue / totalTokens).toFixed(12)} BNB`);

  } else {
    console.log("\\n⚠️ POOL NON INITIALISÉ");
  }
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});