import { ethers } from "hardhat";

async function main() {
  console.log("🚀 DÉPLOIEMENT SIMPLE - CVTC OCEAN BLEU");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log(`📤 Déployeur: ${deployer.address}`);

  try {
    // 1. Déploiement CVTCSwap
    console.log("\n📄 Déploiement CVTCSwap...");
    const CVTCSwap = await ethers.getContractFactory("CVTCSwap");
    const cvtcAddress = process.env.CVTC_ADDRESS || "0x0000000000000000000000000000000000000000";
    const cvtcSwap = await CVTCSwap.deploy(cvtcAddress);
    await cvtcSwap.waitForDeployment();
    console.log(`✅ CVTCSwap déployé: ${await cvtcSwap.getAddress()}`);

    // 2. Déploiement Lock
    console.log("\n🔒 Déploiement Lock...");
    const Lock = await ethers.getContractFactory("Lock");
    const unlockTime = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 an
    const lock = await Lock.deploy(unlockTime);
    await lock.waitForDeployment();
    console.log(`✅ Lock déployé: ${await lock.getAddress()}`);

    // 3. Déploiement CVTCCompounderSimple
    console.log("\n⚡ Déploiement CVTCCompounderSimple...");
    const CVTCCompounderSimple = await ethers.getContractFactory("CVTCCompounderSimple");

    const routerAddress = process.env.ROUTER_ADDRESS || "0x0000000000000000000000000000000000000000";
    const rewardTokenAddress = process.env.REWARD_TOKEN_ADDRESS || cvtcAddress;
    const wbnbAddress = process.env.WBNB_ADDRESS || "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";

    const cvtcCompounder = await CVTCCompounderSimple.deploy(
      routerAddress,
      rewardTokenAddress,
      cvtcAddress,
      wbnbAddress,
      await cvtcSwap.getAddress()
    );
    await cvtcCompounder.waitForDeployment();
    console.log(`✅ CVTCCompounderSimple déployé: ${await cvtcCompounder.getAddress()}`);

    // 4. Déploiement CVTCTransferBasic (SANS Premium)
    console.log("\n📤 Déploiement CVTCTransferBasic...");
    const CVTCTransferBasic = await ethers.getContractFactory("CVTCTransferBasic");
    const cvtcTransferBasic = await CVTCTransferBasic.deploy(cvtcAddress);
    await cvtcTransferBasic.waitForDeployment();
    console.log(`✅ CVTCTransferBasic déployé: ${await cvtcTransferBasic.getAddress()}`);

    // Sauvegarde des adresses
    const deploymentInfo = {
      network: "bscTestnet",
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        CVTCSwap: await cvtcSwap.getAddress(),
        Lock: await lock.getAddress(),
        CVTCCompounderSimple: await cvtcCompounder.getAddress(),
        CVTCTransferBasic: await cvtcTransferBasic.getAddress()
      }
    };

    const fs = require('fs');
    const path = require('path');

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir);
    }

    const deploymentFile = path.join(deploymentsDir, `deployment-simple-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Déploiement sauvegardé: ${deploymentFile}`);

    // Mise à jour du .env
    const envContent = `
# Adresses des contrats déployés - BSC Testnet
CVTC_SWAP_ADDRESS=${await cvtcSwap.getAddress()}
LOCK_ADDRESS=${await lock.getAddress()}
CVTC_COMPOUNDER_ADDRESS=${await cvtcCompounder.getAddress()}
CVTC_TRANSFER_BASIC_ADDRESS=${await cvtcTransferBasic.getAddress()}
`;

    const envFile = path.join(__dirname, "../.env");
    if (fs.existsSync(envFile)) {
      const existingEnv = fs.readFileSync(envFile, 'utf8');
      fs.writeFileSync(envFile, existingEnv + envContent);
    } else {
      fs.writeFileSync(envFile, envContent);
    }
    console.log(`📄 Variables d'environnement mises à jour`);

    console.log("\n🎉 DÉPLOIEMENT TERMINÉ !");
    console.log("📋 Adresses des contrats:");
    console.log(`   CVTCSwap: ${await cvtcSwap.getAddress()}`);
    console.log(`   Lock: ${await lock.getAddress()}`);
    console.log(`   CVTCCompounderSimple: ${await cvtcCompounder.getAddress()}`);
    console.log(`   CVTCTransferBasic: ${await cvtcTransferBasic.getAddress()}`);

  } catch (error: any) {
    console.log("❌ Erreur de déploiement:", error?.message || "Erreur inconnue");
  }
}

main().catch((error) => {
  console.error("❌ Erreur critique:", error);
  process.exitCode = 1;
});
