import { ethers } from "hardhat";

async function main() {
  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";

  const [deployer] = await ethers.getSigners();
  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  console.log("🔧 DEBUG INITIALIZE FUNCTION");
  console.log("============================");

  const BNB_TO_ADD = ethers.parseEther("0.05");
  console.log(`💰 BNB to add: ${ethers.formatEther(BNB_TO_ADD)}`);

  // Test estimate gas first
  try {
    console.log("📊 Estimating gas...");
    const gasEstimate = await swapContract.initializeWithExistingTokens.estimateGas(BNB_TO_ADD, {
      value: BNB_TO_ADD
    });
    console.log(`⛽ Gas estimate: ${gasEstimate}`);
  } catch (error) {
    console.log("❌ Gas estimation failed:", error.message);
    return;
  }

  // Try the call
  try {
    console.log("📡 Calling initializeWithExistingTokens...");
    const tx = await swapContract.initializeWithExistingTokens(BNB_TO_ADD, {
      value: BNB_TO_ADD
    });
    console.log("✅ Transaction sent:", tx.hash);
    await tx.wait();
    console.log("✅ Transaction confirmed!");
  } catch (error) {
    console.log("❌ Transaction failed:", error.message);

    // Try with different value
    console.log("🔄 Trying with exact value match...");
    try {
      const tx2 = await swapContract.initializeWithExistingTokens(BNB_TO_ADD, {
        value: BNB_TO_ADD,
        gasLimit: 200000
      });
      await tx2.wait();
      console.log("✅ Success with gas limit!");
    } catch (error2) {
      console.log("❌ Still failed:", error2.message);
    }
  }
}

main().catch(console.error);