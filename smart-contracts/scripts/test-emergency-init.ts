import { ethers } from "hardhat";

async function main() {
  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";

  const [deployer] = await ethers.getSigners();
  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  console.log("🧪 TEST FONCTION D'URGENCE");
  console.log("==========================");

  console.log(`👤 Deployer: ${deployer.address}`);
  const owner = await swapContract.owner();
  console.log(`👑 Owner: ${owner}`);

  if (deployer.address.toLowerCase() !== owner.toLowerCase()) {
    console.log("❌ Deployer n'est pas le owner du contrat!");
    return;
  }

  // Tester emergencyInitialize (nouvelle fonction)
  try {
    console.log("📡 Test emergencyInitialize...");
    const tx = await swapContract.emergencyInitialize();
    console.log("✅ Transaction sent:", tx.hash);
    await tx.wait();
    console.log("✅ Emergency initialization successful!");

    // Vérifier les réserves
    const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
    console.log(`💰 BNB Reserve: ${ethers.formatEther(bnbReserve)}`);
    console.log(`🪙 CVTC Reserve: ${ethers.formatUnits(cvtcReserve, 2)}`);

  } catch (error) {
    console.log("❌ Emergency initialize failed:", error.message);
  }
}

main().catch(console.error);