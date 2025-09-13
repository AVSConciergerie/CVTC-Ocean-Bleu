import { ethers } from "hardhat";

async function main() {
  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const [deployer] = await ethers.getSigners();
  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);

  console.log("🔍 CHECK TOKEN INTERFACE");
  console.log("========================");

  // Test direct balance check
  try {
    const balance = await cvtcToken.balanceOf(SWAP_ADDRESS);
    console.log(`✅ Direct balance check: ${ethers.formatUnits(balance, 2)} CVTC`);
  } catch (error) {
    console.log("❌ Direct balance check failed:", error.message);
  }

  // Test contract calling balanceOf
  try {
    const cvtcTokenFromContract = await ethers.getContractAt("IERC20", CVTC_TOKEN_ADDRESS);
    const balanceFromContract = await cvtcTokenFromContract.balanceOf(SWAP_ADDRESS);
    console.log(`✅ Contract balance check: ${ethers.formatUnits(balanceFromContract, 2)} CVTC`);
  } catch (error) {
    console.log("❌ Contract balance check failed:", error.message);
  }

  // Test if contract can call its own token
  try {
    const contractCvtcToken = await swapContract.cvtcToken();
    console.log(`📋 Contract's token address: ${contractCvtcToken}`);

    if (contractCvtcToken.toLowerCase() !== CVTC_TOKEN_ADDRESS.toLowerCase()) {
      console.log("❌ Token address mismatch!");
      return;
    }

    // Try to call balanceOf through the contract's interface
    const tokenContract = await ethers.getContractAt("IERC20", contractCvtcToken);
    const balance = await tokenContract.balanceOf(SWAP_ADDRESS);
    console.log(`✅ Contract's token balance: ${ethers.formatUnits(balance, 2)} CVTC`);
  } catch (error) {
    console.log("❌ Contract token interface failed:", error.message);
  }
}

main().catch(console.error);