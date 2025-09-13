import { ethers } from "hardhat";

async function main() {
  console.log("🎯 INITIALISATION FINALE - RATIO 0.00002/2.5B");
  console.log("=============================================");

  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  // Vérifier si emergencySetReserves existe
  console.log("\\n🔍 VÉRIFICATION FONCTIONS DISPONIBLES:");

  try {
    // Tester emergencySetReserves
    const testBnb = ethers.parseEther("0.00002");
    const testCvtc = ethers.parseUnits("2500000000", 2);

    console.log("🧪 Test emergencySetReserves...");
    const estimateGas = await swapContract.emergencySetReserves.estimateGas(testBnb, testCvtc);
    console.log(`✅ emergencySetReserves existe! Gas estimé: ${estimateGas}`);

    // Exécuter l'initialisation
    console.log("\\n🚀 INITIALISATION FINALE:");
    console.log(`💰 BNB réserve cible: ${ethers.formatEther(testBnb)}`);
    console.log(`🪙 CVTC réserve cible: ${ethers.formatUnits(testCvtc, 2)}`);

    const initTx = await swapContract.emergencySetReserves(testBnb, testCvtc);
    await initTx.wait();

    console.log("✅ INITIALISATION RÉUSSIE!");
    console.log(`📋 Hash: ${initTx.hash}`);

    // Vérification finale
    const [finalBnb, finalCvtc] = await swapContract.getReserves();
    console.log(`\\n🎉 RÉSULTAT FINAL:`);
    console.log(`💰 BNB réserve: ${ethers.formatEther(finalBnb)}`);
    console.log(`🪙 CVTC réserve: ${ethers.formatUnits(finalCvtc, 2)}`);

    const finalRatio = Number(ethers.formatUnits(finalCvtc, 2)) / Number(ethers.formatEther(finalBnb));
    console.log(`📈 Ratio final: 1 BNB = ${finalRatio.toLocaleString()} CVTC`);

    // Vérifier que c'est exactement ce qui était demandé
    const targetRatio = 2500000000 / 0.00002;
    console.log(`🎯 Ratio demandé: 1 BNB = ${targetRatio.toLocaleString()} CVTC`);

    if (Math.abs(finalRatio - targetRatio) < 1) {
      console.log("\\n🎊 PARFAIT ! CONFIGURATION EXACTE ATTEINTE !");
      console.log("==========================================");
      console.log("✅ Ratio anti-baleine activé");
      console.log("✅ Volatilité maximale");
      console.log("🚀 Onboarding prêt !");
    } else {
      console.log(`\\n⚠️ Petit écart: ${Math.abs(finalRatio - targetRatio)}`);
    }

  } catch (error) {
    console.log("❌ emergencySetReserves n'existe pas ou erreur:", error.message);

    console.log("\\n🔧 SOLUTIONS ALTERNATIVES:");

    // Solution 1: Via explorateur BSC Testnet
    console.log("\\n🌐 SOLUTION 1: EXPLORATEUR BSC TESTNET");
    console.log("====================================");
    console.log(`1. Aller sur: https://testnet.bscscan.com/address/${SWAP_ADDRESS}#writeContract`);
    console.log("2. Connecter votre wallet MetaMask");
    console.log("3. Chercher 'emergencySetReserves' dans la liste des fonctions");
    console.log("4. Si elle n'existe pas, chercher d'autres fonctions de set");
    console.log("5. Paramètres à utiliser:");
    console.log(`   - _bnbReserve: 20000000000000 (0.00002 BNB en wei)`);
    console.log(`   - _cvtcReserve: 250000000000 (2.5 milliards CVTC en unités)`);

    // Solution 2: Modifier le contrat
    console.log("\\n📝 SOLUTION 2: MODIFICATION CONTRAT");
    console.log("=================================");
    console.log("Si emergencySetReserves n'existe pas:");
    console.log("1. Ajouter la fonction au contrat source");
    console.log("2. Redéployer le contrat");
    console.log("3. Migrer les tokens et BNB");

    // Solution 3: Fonction alternative
    console.log("\\n🔄 SOLUTION 3: FONCTION ALTERNATIVE");
    console.log("=================================");
    console.log("Chercher d'autres fonctions qui peuvent ajuster les réserves:");
    console.log("- setReserves()");
    console.log("- updateReserves()");
    console.log("- initializeWithExistingTokens()");
  }
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});