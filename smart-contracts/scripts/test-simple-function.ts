import { ethers } from "hardhat";

async function main() {
  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";

  const [deployer] = await ethers.getSigners();
  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  console.log("🧪 TEST SIMPLE FUNCTIONS");
  console.log("========================");

  // Test 1: toggleLiquidity
  try {
    console.log("📡 Test toggleLiquidity...");
    const currentState = await swapContract.liquidityEnabled();
    console.log(`🔓 Current liquidity state: ${currentState}`);

    const tx = await swapContract.toggleLiquidity();
    console.log("✅ toggleLiquidity transaction sent:", tx.hash);
    await tx.wait();

    const newState = await swapContract.liquidityEnabled();
    console.log(`🔓 New liquidity state: ${newState}`);
    console.log("✅ toggleLiquidity works!");
  } catch (error) {
    console.log("❌ toggleLiquidity failed:", error.message);
  }

  // Test 2: getReserves
  try {
    console.log("📡 Test getReserves...");
    const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
    console.log(`💰 BNB Reserve: ${ethers.formatEther(bnbReserve)}`);
    console.log(`🪙 CVTC Reserve: ${ethers.formatUnits(cvtcReserve, 2)}`);
    console.log("✅ getReserves works!");
  } catch (error) {
    console.log("❌ getReserves failed:", error.message);
  }
}

main().catch(console.error);