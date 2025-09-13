import { ethers } from "hardhat";

async function main() {
  console.log("🔍 DÉBOGAGE EMERGENCY INITIALIZE");
  console.log("===============================");

  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);

  // Vérifications préalables
  console.log("\\n📋 VÉRIFICATIONS PRÉALABLES:");

  // 1. Vérifier si on est owner
  const owner = await swapContract.owner();
  console.log(`👑 Owner du contrat: ${owner}`);
  console.log(`🔍 Est-ce que deployer est owner? ${owner.toLowerCase() === deployer.address.toLowerCase() ? '✅ OUI' : '❌ NON'}`);

  // 2. Vérifier si liquidité activée
  const liquidityEnabled = await swapContract.liquidityEnabled();
  console.log(`🔓 Liquidité activée: ${liquidityEnabled ? '✅ OUI' : '❌ NON'}`);

  // 3. Vérifier les réserves actuelles
  const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
  console.log(`💰 BNB réserve actuelle: ${ethers.formatEther(bnbReserve)}`);
  console.log(`🪙 CVTC réserve actuelle: ${ethers.formatUnits(cvtcReserve, 2)}`);

  // 4. Vérifier les balances du contrat
  const contractCvtcBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
  const contractBnbBalance = await ethers.provider.getBalance(SWAP_ADDRESS);
  console.log(`🏦 CVTC dans contrat: ${ethers.formatUnits(contractCvtcBalance, 2)}`);
  console.log(`💰 BNB dans contrat: ${ethers.formatEther(contractBnbBalance)}`);

  // Conditions pour emergencyInitialize
  console.log("\\n🔍 CONDITIONS POUR EMERGENCY INITIALIZE:");
  console.log(`1. Liquidity enabled: ${liquidityEnabled ? '✅' : '❌'}`);
  console.log(`2. BNB reserve == 0: ${bnbReserve == 0n ? '✅' : '❌'} (${ethers.formatEther(bnbReserve)})`);
  console.log(`3. CVTC reserve == 0: ${cvtcReserve == 0n ? '✅' : '❌'} (${ethers.formatUnits(cvtcReserve, 2)})`);
  console.log(`4. Contract has CVTC: ${contractCvtcBalance > 0n ? '✅' : '❌'} (${ethers.formatUnits(contractCvtcBalance, 2)})`);

  const canInitialize = liquidityEnabled && bnbReserve == 0n && cvtcReserve == 0n && contractCvtcBalance > 0n;
  console.log(`\\n🎯 PEUT INITIALISER: ${canInitialize ? '✅ OUI' : '❌ NON'}`);

  if (!canInitialize) {
    console.log("\\n🔧 PROBLÈMES DÉTECTÉS:");

    if (!liquidityEnabled) {
      console.log("❌ Liquidité pas activée - Activer d'abord");
      try {
        console.log("🔓 Activation liquidité...");
        const toggleTx = await swapContract.toggleLiquidity();
        await toggleTx.wait();
        console.log("✅ Liquidité activée!");
      } catch (error) {
        console.log("❌ Impossible d'activer liquidité:", error.message);
      }
    }

    if (bnbReserve > 0n) {
      console.log(`❌ BNB réserve déjà initialisée: ${ethers.formatEther(bnbReserve)}`);
      console.log("💡 Il faut reset les réserves ou utiliser une autre méthode");
    }

    if (cvtcReserve > 0n) {
      console.log(`❌ CVTC réserve déjà initialisée: ${ethers.formatUnits(cvtcReserve, 2)}`);
      console.log("💡 Il faut reset les réserves ou utiliser une autre méthode");
    }
  }

  // Essayer emergencyInitialize
  console.log("\\n🚨 TENTATIVE EMERGENCY INITIALIZE:");
  try {
    const initTx = await swapContract.emergencyInitialize();
    await initTx.wait();
    console.log("✅ EMERGENCY INITIALIZE RÉUSSI!");
    console.log(`📋 Hash: ${initTx.hash}`);

    // Vérifier après
    const [finalBnb, finalCvtc] = await swapContract.getReserves();
    console.log(`\\n📊 APRÈS INITIALISATION:`);
    console.log(`💰 BNB réserve: ${ethers.formatEther(finalBnb)}`);
    console.log(`🪙 CVTC réserve: ${ethers.formatUnits(finalCvtc, 2)}`);

    if (finalCvtc > 0n) {
      const ratio = Number(ethers.formatUnits(finalCvtc, 2)) / Number(ethers.formatEther(finalBnb));
      console.log(`📈 Ratio final: 1 BNB = ${ratio.toLocaleString()} CVTC`);
      console.log("\\n🎉 SUCCÈS ! POOL INITIALISÉ !");
    }

  } catch (error) {
    console.log("❌ EMERGENCY INITIALIZE ÉCHOUÉ:");
    console.log(`Erreur: ${error.message}`);

    // Analyser l'erreur
    if (error.message.includes("execution reverted")) {
      console.log("\\n🔍 ANALYSE DE L'ERREUR:");
      console.log("💡 Le contrat revert sans message détaillé");
      console.log("💡 Possibles causes:");
      console.log("   - Une des conditions require() n'est pas remplie");
      console.log("   - Problème de permissions");
      console.log("   - Bug dans le contrat déployé");
    }

    // Proposition alternative
    console.log("\\n🔧 SOLUTIONS ALTERNATIVES:");
    console.log("1. 📝 Ajouter une fonction setReserves() au contrat");
    console.log("2. 🔄 Redéployer le contrat avec corrections");
    console.log("3. 🛠️ Utiliser l'explorateur pour appel manuel");

    console.log("\\n🎯 RECOMMANDATION:");
    console.log("Utiliser l'explorateur BSC Testnet pour:");
    console.log("- Vérifier les conditions exactes");
    console.log("- Appeler emergencyInitialize() manuellement");
    console.log("- Voir l'erreur détaillée");
  }
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});