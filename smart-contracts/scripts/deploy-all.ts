import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting deployment of all CVTC contracts to BSC Testnet...");

  const [deployer] = await ethers.getSigners();
  console.log(`📋 Deploying with account: ${deployer.address}`);
  console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} BNB`);

  // Deploy CVTCSwap first (needed for CVTCCompounder)
  console.log("\n📄 Deploying CVTCSwap...");
  const CVTCSwap = await ethers.getContractFactory("CVTCSwap");

  // For demo purposes, using a placeholder CVTC address
  // In production, this should be the actual CVTC token address
  const cvtcAddress = process.env.CVTC_ADDRESS || "0x0000000000000000000000000000000000000000";
  console.log(`🎯 CVTC Token Address: ${cvtcAddress}`);

   const cvtcSwap = await CVTCSwap.deploy(cvtcAddress);
   await cvtcSwap.waitForDeployment();
   console.log(`✅ CVTCSwap deployed to: ${await cvtcSwap.getAddress()}`);

  // Deploy Lock contract
  console.log("\n🔒 Deploying Lock contract...");
  const Lock = await ethers.getContractFactory("Lock");
  const unlockTime = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year from now
   const lock = await Lock.deploy(unlockTime); // Pas de valeur envoyée
   await lock.waitForDeployment();
   console.log(`✅ Lock deployed to: ${await lock.getAddress()}`);

  // Deploy CVTCPremium
  console.log("\n👑 Deploying CVTCPremium...");
  const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
   const cvtcPremium = await CVTCPremium.deploy(cvtcAddress, await cvtcSwap.getAddress());
   await cvtcPremium.waitForDeployment();
   console.log(`✅ CVTCPremium deployed to: ${await cvtcPremium.getAddress()}`);

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
     await cvtcSwap.getAddress()
   );
   await cvtcCompounder.waitForDeployment();
   console.log(`✅ CVTCCompounder deployed to: ${await cvtcCompounder.getAddress()}`);

  // Save deployment addresses to a file
  const deploymentInfo = {
    network: "bscTestnet",
    chainId: 97,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      CVTCSwap: {
        address: await cvtcSwap.getAddress(),
        constructorArgs: [cvtcAddress]
      },
      CVTCPremium: {
        address: await cvtcPremium.getAddress(),
        constructorArgs: [cvtcAddress, await cvtcSwap.getAddress()]
      },
      Lock: {
        address: await lock.getAddress(),
        constructorArgs: [unlockTime]
      },
      CVTCCompounderSimple: {
        address: await cvtcCompounder.getAddress(),
        constructorArgs: [
          routerAddress,
          rewardTokenAddress,
          cvtcAddress,
          wbnbAddress,
          await cvtcSwap.getAddress()
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
CVTC_SWAP_ADDRESS=${await cvtcSwap.getAddress()}
CVTC_PREMIUM_ADDRESS=${await cvtcPremium.getAddress()}
LOCK_ADDRESS=${await lock.getAddress()}
CVTC_COMPOUNDER_ADDRESS=${await cvtcCompounder.getAddress()}
`;

  const envFile = path.join(deploymentsDir, "contracts.env");
  fs.writeFileSync(envFile, envContent);
  console.log(`📄 Environment variables saved to: ${envFile}`);

  console.log("\n🎉 All contracts deployed successfully!");
  console.log("📋 Contract Addresses:");
  console.log(`   CVTCSwap: ${await cvtcSwap.getAddress()}`);
  console.log(`   CVTCPremium: ${await cvtcPremium.getAddress()}`);
  console.log(`   Lock: ${await lock.getAddress()}`);
  console.log(`   CVTCCompounder: ${await cvtcCompounder.getAddress()}`);

  console.log("\n🔍 Verify contracts on BSCScan:");
  console.log(`   https://testnet.bscscan.com/address/${await cvtcSwap.getAddress()}`);
  console.log(`   https://testnet.bscscan.com/address/${await cvtcPremium.getAddress()}`);
  console.log(`   https://testnet.bscscan.com/address/${await lock.getAddress()}`);
  console.log(`   https://testnet.bscscan.com/address/${await cvtcCompounder.getAddress()}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});