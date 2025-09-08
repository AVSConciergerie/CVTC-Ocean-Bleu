import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting deployment of all CVTC contracts to BSC Testnet...");

  const [deployer] = await ethers.getSigners();
  console.log(`📋 Deploying with account: ${deployer.address}`);
  console.log(`💰 Account balance: ${ethers.utils.formatEther(await ethers.provider.getBalance(deployer.address))} BNB`);

  // Deploy CVTCSwap first (needed for CVTCCompounder)
  console.log("\n📄 Deploying CVTCSwap...");
  const CVTCSwap = await ethers.getContractFactory("CVTCSwap");

  // For demo purposes, using a placeholder CVTC address
  // In production, this should be the actual CVTC token address
  const cvtcAddress = process.env.CVTC_ADDRESS || "0x0000000000000000000000000000000000000000";
  console.log(`🎯 CVTC Token Address: ${cvtcAddress}`);

  const cvtcSwap = await CVTCSwap.deploy(cvtcAddress);
  await cvtcSwap.deployed();
  console.log(`✅ CVTCSwap deployed to: ${cvtcSwap.address}`);

  // Deploy Lock contract
  console.log("\n🔒 Deploying Lock contract...");
  const Lock = await ethers.getContractFactory("Lock");
  const unlockTime = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year from now
  const lock = await Lock.deploy(unlockTime); // Pas de valeur envoyée
  await lock.deployed();
  console.log(`✅ Lock deployed to: ${lock.address}`);

  // Deploy CVTCPremium
  console.log("\n👑 Deploying CVTCPremium...");
  const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
  const cvtcPremium = await CVTCPremium.deploy(cvtcAddress, cvtcSwap.address);
  await cvtcPremium.deployed();
  console.log(`✅ CVTCPremium deployed to: ${cvtcPremium.address}`);

  // Deploy CVTCCompounderSimple (version simplifiée sans farming)
  console.log("\n⚡ Deploying CVTCCompounderSimple...");
  const CVTCCompounderSimple = await ethers.getContractFactory("CVTCCompounderSimple");

  const routerAddress = process.env.ROUTER_ADDRESS || "0x0000000000000000000000000000000000000000";
  const rewardTokenAddress = process.env.REWARD_TOKEN_ADDRESS || cvtcAddress;
  const wbnbAddress = process.env.WBNB_ADDRESS || "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";

  console.log(`🔄 Router Address: ${routerAddress}`);
  console.log(`🎁 Reward Token: ${rewardTokenAddress}`);
  console.log(`💧 WBNB: ${wbnbAddress}`);

  const cvtcCompounder = await CVTCCompounderSimple.deploy(
    routerAddress,
    rewardTokenAddress,
    cvtcAddress,
    wbnbAddress,
    cvtcSwap.address
  );
  await cvtcCompounder.deployed();
  console.log(`✅ CVTCCompounder deployed to: ${cvtcCompounder.address}`);

  // Save deployment addresses to a file
  const deploymentInfo = {
    network: "bscTestnet",
    chainId: 97,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      CVTCSwap: {
        address: cvtcSwap.address,
        constructorArgs: [cvtcAddress]
      },
      CVTCPremium: {
        address: cvtcPremium.address,
        constructorArgs: [cvtcAddress, cvtcSwap.address]
      },
      Lock: {
        address: lock.address,
        constructorArgs: [unlockTime]
      },
      CVTCCompounderSimple: {
        address: cvtcCompounder.address,
        constructorArgs: [
          routerAddress,
          rewardTokenAddress,
          cvtcAddress,
          wbnbAddress,
          cvtcSwap.address
        ]
      }
    }
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFile = path.join(deploymentsDir, `deployment-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  // Also save to .env format for easy copying
  const envContent = `# CVTC Contract Addresses - BSC Testnet
CVTC_SWAP_ADDRESS=${cvtcSwap.address}
CVTC_PREMIUM_ADDRESS=${cvtcPremium.address}
LOCK_ADDRESS=${lock.address}
CVTC_COMPOUNDER_ADDRESS=${cvtcCompounder.address}
`;

  const envFile = path.join(deploymentsDir, "contracts.env");
  fs.writeFileSync(envFile, envContent);
  console.log(`📄 Environment variables saved to: ${envFile}`);

  console.log("\n🎉 All contracts deployed successfully!");
  console.log("📋 Contract Addresses:");
  console.log(`   CVTCSwap: ${cvtcSwap.address}`);
  console.log(`   CVTCPremium: ${cvtcPremium.address}`);
  console.log(`   Lock: ${lock.address}`);
  console.log(`   CVTCCompounder: ${cvtcCompounder.address}`);

  console.log("\n🔍 Verify contracts on BSCScan:");
  console.log(`   https://testnet.bscscan.com/address/${cvtcSwap.address}`);
  console.log(`   https://testnet.bscscan.com/address/${cvtcPremium.address}`);
  console.log(`   https://testnet.bscscan.com/address/${lock.address}`);
  console.log(`   https://testnet.bscscan.com/address/${cvtcCompounder.address}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});