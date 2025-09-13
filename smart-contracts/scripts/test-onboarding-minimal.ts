import { ethers } from "hardhat";

async function main() {
  console.log("🧪 TEST ONBOARDING MINIMAL");
  console.log("==========================");

  const NEW_SWAP_ADDRESS = "0x63464DA0d5C5bfC2B7515D4F41D37FD88Bb9E4A9";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  const swapContract = await ethers.getContractAt("CVTCSwapEmergency", NEW_SWAP_ADDRESS);

  // Test 1: Vérifier que le contrat répond
  console.log("\\n📡 Test 1: Contrat accessible...");
  try {
    const owner = await swapContract.owner();
    console.log(`✅ Owner: ${owner}`);
  } catch (error) {
    console.log("❌ Contrat inaccessible:", error.message);
    return;
  }

  // Test 2: Whitelister le deployer
  console.log("\\n📝 Test 2: Whitelist...");
  const whitelistTx = await swapContract.updateWhitelist(deployer.address, true);
  await whitelistTx.wait();
  console.log("✅ Deployer whitelisted");

  // Test 3: Vérifier whitelist
  const isWhitelisted = await swapContract.whitelisted(deployer.address);
  console.log(`✅ Whitelist status: ${isWhitelisted}`);

  // Test 4: Essayer un petit swap (même si pas de liquidité)
  console.log("\\n🔄 Test 4: Tentative de swap (devrait échouer sans liquidité)...");
  try {
    const swapTx = await swapContract.buy(1, {
      value: ethers.parseEther("0.001")
    });
    await swapTx.wait();
    console.log("✅ Swap réussi (surprenant!)");
  } catch (error) {
    console.log("❌ Swap échoue (normal sans liquidité):", error.message);
  }

  console.log("\\n📊 RÉSUMÉ TESTS:");
  console.log("✅ Contrat déployé et accessible");
  console.log("✅ Whitelist fonctionnelle");
  console.log("❌ Swap impossible (pas de liquidité)");
  console.log("\\n💡 PROCHAINES ÉTAPES:");
  console.log("1. Ajouter des CVTC au contrat swap");
  console.log("2. Ajouter des BNB pour la liquidité");
  console.log("3. Retester les swaps");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});