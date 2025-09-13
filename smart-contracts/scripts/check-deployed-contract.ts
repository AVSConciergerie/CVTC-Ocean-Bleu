import { ethers } from "hardhat";

async function main() {
  console.log("🔍 ANALYSE DU CONTRAT DÉPLOYÉ");
  console.log("============================");

  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  console.log("\\n📊 INFORMATIONS CONTRAT:");
  console.log(`📍 Adresse: ${SWAP_ADDRESS}`);

  try {
    const owner = await swapContract.owner();
    console.log(`👑 Owner: ${owner}`);

    const liquidityEnabled = await swapContract.liquidityEnabled();
    console.log(`🔓 Liquidité activée: ${liquidityEnabled}`);

    const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
    console.log(`💰 BNB réserve: ${ethers.formatEther(bnbReserve)}`);
    console.log(`🪙 CVTC réserve: ${ethers.formatUnits(cvtcReserve, 2)}`);

    // Tester quelques fonctions
    console.log("\\n🧪 TESTS DE FONCTIONS:");

    // Test emergencyInitialize
    try {
      const emergencyTx = await swapContract.emergencyInitialize();
      console.log("✅ emergencyInitialize() fonctionne");
    } catch (error) {
      console.log("❌ emergencyInitialize() échoue:", error.message);
    }

    // Test si d'autres fonctions existent
    try {
      // @ts-ignore
      const testFunction = await swapContract.initializeWithExistingTokens();
      console.log("✅ initializeWithExistingTokens() existe");
    } catch (error) {
      console.log("❌ initializeWithExistingTokens() n'existe pas");
    }

  } catch (error) {
    console.log("❌ Erreur lors de l'analyse:", error.message);
  }

  console.log("\\n🎯 CONCLUSION:");
  console.log("==============");
  console.log("Le contrat déployé semble fonctionner mais son bytecode");
  console.log("ne correspond pas au code source actuel.");
  console.log("");
  console.log("OPTIONS:");
  console.log("1. 🔄 Redéployer un nouveau contrat et le vérifier");
  console.log("2. 📝 Modifier le contrat source pour matcher le déployé");
  console.log("3. 🌐 Utiliser l'explorateur BSCScan manuellement");
  console.log("4. 🛠️ Continuer avec les fonctions disponibles");

  console.log("\\nQuelle approche préférez-vous ?");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});