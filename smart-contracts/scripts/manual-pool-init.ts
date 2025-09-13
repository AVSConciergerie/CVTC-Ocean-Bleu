import { ethers } from "hardhat";

async function main() {
  console.log("🔧 INITIALISATION MANUELLE DU POOL");
  console.log("==================================");

  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);

  // Vérifier l'état actuel
  console.log("\\n📊 ÉTAT ACTUEL:");
  const contractBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
  const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
  console.log(`🏦 CVTC dans contrat: ${ethers.formatUnits(contractBalance, 2)}`);
  console.log(`💰 BNB réserve: ${ethers.formatEther(bnbReserve)}`);
  console.log(`🪙 CVTC réserve: ${ethers.formatUnits(cvtcReserve, 2)}`);

  // Méthode 1: Transfert direct de BNB au contrat
  console.log("\\n💰 MÉTHODE 1: Transfert direct de BNB...");
  const tinyBnbAmount = ethers.parseEther("0.00002");

  try {
    const transferTx = await deployer.sendTransaction({
      to: SWAP_ADDRESS,
      value: tinyBnbAmount
    });
    await transferTx.wait();
    console.log("✅ BNB transféré directement au contrat");
    console.log(`📋 Hash: ${transferTx.hash}`);

    // Vérifier si les réserves ont été mises à jour
    const [bnbAfterTransfer, cvtcAfterTransfer] = await swapContract.getReserves();
    console.log(`📊 Après transfert - BNB: ${ethers.formatEther(bnbAfterTransfer)}, CVTC: ${ethers.formatUnits(cvtcAfterTransfer, 2)}`);

    // Si CVTC réserve est toujours 0, essayer de l'initialiser manuellement
    if (cvtcAfterTransfer == 0n && contractBalance > 0n) {
      console.log("\\n🪙 MÉTHODE 2: Initialisation manuelle CVTC...");

      // Essayer d'appeler directement la fonction pour définir cvtcReserve
      // Note: Cette approche nécessite une fonction spéciale dans le contrat

      console.log("💡 Le contrat n'a pas de fonction pour initialiser CVTC manuellement");
      console.log("🔧 Il faudrait ajouter une fonction setCvtcReserve() au contrat");

      // Alternative: Créer un nouveau contrat avec fonction d'urgence
      console.log("\\n🏗️ ALTERNATIVE: Nouveau contrat avec fonction d'urgence...");

      const CVTCSwapEmergency = await ethers.getContractFactory("CVTCSwapEmergency");
      const emergencySwap = await CVTCSwapEmergency.deploy(CVTC_TOKEN_ADDRESS);
      await emergencySwap.waitForDeployment();

      const newAddress = await emergencySwap.getAddress();
      console.log(`✅ Nouveau contrat déployé: ${newAddress}`);

      // Migrer les tokens
      console.log("\\n🔄 Migration des tokens...");
      const migrateTx = await cvtcToken.transfer(newAddress, contractBalance);
      await migrateTx.wait();
      console.log("✅ Tokens migrés vers nouveau contrat");

      // Initialiser le nouveau contrat
      const initTx = await emergencySwap.emergencyInitialize();
      await initTx.wait();
      console.log("✅ Nouveau contrat initialisé");

      // Ajouter BNB
      const addBnbTx = await emergencySwap.addInitialBnb({ value: tinyBnbAmount });
      await addBnbTx.wait();
      console.log("✅ BNB ajouté au nouveau contrat");

      // Vérifier le résultat
      const [finalBnb, finalCvtc] = await emergencySwap.getReserves();
      console.log(`\\n🎯 RÉSULTAT FINAL:`);
      console.log(`💰 BNB: ${ethers.formatEther(finalBnb)}`);
      console.log(`🪙 CVTC: ${ethers.formatUnits(finalCvtc, 2)}`);
      console.log(`📍 Nouvelle adresse: ${newAddress}`);

      if (finalBnb > 0n && finalCvtc > 0n) {
        console.log("\\n🎉 SUCCÈS ! NOUVEAU POOL ANTI-BALEINE CRÉÉ");
        console.log("=========================================");
        console.log("✅ Ratio extrême activé");
        console.log("✅ Volatilité maximale");
        console.log("🔄 Migration des tokens réussie");
      }
    }

  } catch (error) {
    console.log("❌ Transfert direct échoue:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});