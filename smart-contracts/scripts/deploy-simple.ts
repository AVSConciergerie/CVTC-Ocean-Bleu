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
    await cvtcSwap.deployed();
    console.log(`✅ CVTCSwap déployé: ${cvtcSwap.address}`);

    // 2. Déploiement Lock
    console.log("\n🔒 Déploiement Lock...");
    const Lock = await ethers.getContractFactory("Lock");
    const unlockTime = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 an
    const lock = await Lock.deploy(unlockTime);
    await lock.deployed();
    console.log(`✅ Lock déployé: ${lock.address}`);

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
      cvtcSwap.address
    );
    await cvtcCompounder.deployed();
    console.log(`✅ CVTCCompounderSimple déployé: ${cvtcCompounder.address}`);

    // 4. Déploiement CVTCPremium
    console.log("\n👑 Déploiement CVTCPremium...");
    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
    const cvtcPremium = await CVTCPremium.deploy(cvtcAddress, cvtcSwap.address);
    await cvtcPremium.deployed();
    console.log(`✅ CVTCPremium déployé: ${cvtcPremium.address}`);

    // Sauvegarde des adresses
    const deploymentInfo = {
      network: "bscTestnet",
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        CVTCSwap: cvtcSwap.address,
        Lock: lock.address,
        CVTCCompounderSimple: cvtcCompounder.address,
        CVTCPremium: cvtcPremium.address
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
CVTC_SWAP_ADDRESS=${cvtcSwap.address}
LOCK_ADDRESS=${lock.address}
CVTC_COMPOUNDER_ADDRESS=${cvtcCompounder.address}
CVTC_PREMIUM_ADDRESS=${cvtcPremium.address}
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
    console.log(`   CVTCSwap: ${cvtcSwap.address}`);
    console.log(`   Lock: ${lock.address}`);
    console.log(`   CVTCCompounderSimple: ${cvtcCompounder.address}`);
    console.log(`   CVTCPremium: ${cvtcPremium.address}`);

  } catch (error: any) {
    console.log("❌ Erreur de déploiement:", error?.message || "Erreur inconnue");
  }
}

main().catch((error) => {
  console.error("❌ Erreur critique:", error);
  process.exitCode = 1;
});
