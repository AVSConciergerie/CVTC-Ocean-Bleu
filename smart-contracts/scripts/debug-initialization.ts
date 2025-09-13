import { ethers } from "hardhat";

async function main() {
  console.log("🔍 DIAGNOSTIC INITIALISATION");
  console.log("============================");

  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);

  // Test 1: Vérifier que le contrat répond
  console.log("\\n📡 Test 1: Contrat accessible...");
  try {
    const owner = await swapContract.owner();
    console.log(`✅ Owner: ${owner}`);
  } catch (error) {
    console.log("❌ Contrat inaccessible:", error.message);
    return;
  }

  // Test 2: Vérifier les tokens dans le contrat
  console.log("\\n🪙 Test 2: Tokens CVTC...");
  const contractBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
  console.log(`✅ CVTC dans contrat: ${ethers.formatUnits(contractBalance, 2)}`);

  // Test 3: Vérifier les réserves actuelles
  console.log("\\n📊 Test 3: Réserves actuelles...");
  const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
  console.log(`✅ BNB réserve: ${ethers.formatEther(bnbReserve)}`);
  console.log(`✅ CVTC réserve: ${ethers.formatUnits(cvtcReserve, 2)}`);

  // Test 4: Vérifier si liquidityEnabled
  console.log("\\n⚙️ Test 4: Liquidité activée...");
  const liquidityEnabled = await swapContract.liquidityEnabled();
  console.log(`✅ Liquidité activée: ${liquidityEnabled}`);

  // Test 5: Essayer emergencyInitialize d'abord
  console.log("\\n🚨 Test 5: Emergency initialize...");
  if (bnbReserve == 0n && cvtcReserve == 0n && contractBalance > 0n) {
    try {
      const emergencyTx = await swapContract.emergencyInitialize();
      await emergencyTx.wait();
      console.log("✅ Emergency initialize réussi!");
      console.log(`📋 Hash: ${emergencyTx.hash}`);

      // Vérifier après emergency
      const [bnbAfter, cvtcAfter] = await swapContract.getReserves();
      console.log(`📊 Après emergency - BNB: ${ethers.formatEther(bnbAfter)}, CVTC: ${ethers.formatUnits(cvtcAfter, 2)}`);

      // Maintenant essayer d'ajouter BNB
      console.log("\\n💰 Test 6: Ajout BNB après emergency...");
      const tinyBnbAmount = ethers.parseEther("0.00002");
      const addBnbTx = await deployer.sendTransaction({
        to: SWAP_ADDRESS,
        value: tinyBnbAmount
      });
      await addBnbTx.wait();
      console.log("✅ BNB ajouté via sendTransaction");
      console.log(`📋 Hash: ${addBnbTx.hash}`);

      // Vérifier les réserves finales
      const [finalBnb, finalCvtc] = await swapContract.getReserves();
      console.log(`\\n🎯 RÉSULTAT FINAL:`);
      console.log(`💰 BNB: ${ethers.formatEther(finalBnb)}`);
      console.log(`🪙 CVTC: ${ethers.formatUnits(finalCvtc, 2)}`);

    } catch (error) {
      console.log("❌ Emergency initialize échoue:", error.message);
    }
  } else {
    console.log("⚠️ Conditions non remplies pour emergency initialize");
  }
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});