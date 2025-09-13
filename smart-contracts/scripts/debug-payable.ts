import { ethers } from "hardhat";

async function main() {
  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";

  const [deployer] = await ethers.getSigners();
  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  console.log("🔍 DEBUG PAYABLE FUNCTION");
  console.log("=========================");

  const BNB_TO_ADD = ethers.parseEther("0.01"); // Smaller amount
  console.log(`💰 BNB to add: ${ethers.formatEther(BNB_TO_ADD)}`);

  // Test 1: Call without value
  try {
    console.log("📡 Test 1: Call without value...");
    await swapContract.initializeWithExistingTokens(BNB_TO_ADD);
    console.log("✅ Success without value!");
  } catch (error) {
    console.log("❌ Failed without value:", error.message);
  }

  // Test 2: Call with value but wrong amount
  try {
    console.log("📡 Test 2: Call with wrong value...");
    await swapContract.initializeWithExistingTokens(BNB_TO_ADD, {
      value: ethers.parseEther("0.02") // Different amount
    });
    console.log("✅ Success with wrong value!");
  } catch (error) {
    console.log("❌ Failed with wrong value:", error.message);
  }

  // Test 3: Call with correct value
  try {
    console.log("📡 Test 3: Call with correct value...");
    const tx = await swapContract.initializeWithExistingTokens(BNB_TO_ADD, {
      value: BNB_TO_ADD
    });
    console.log("✅ Transaction sent:", tx.hash);
    await tx.wait();
    console.log("✅ Success with correct value!");
  } catch (error) {
    console.log("❌ Failed with correct value:", error.message);
  }
}

main().catch(console.error);