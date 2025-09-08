import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Déploiement du CVTCCompounder simplifié...");

  const [deployer] = await ethers.getSigners();
  console.log(`📋 Déploiement avec: ${deployer.address}`);

  // Déployer CVTCCompounderSimple
  console.log("\n📄 Déploiement de CVTCCompounderSimple...");
  const CVTCCompounderSimple = await ethers.getContractFactory("CVTCCompounderSimple");

  const routerAddress = process.env.ROUTER_ADDRESS || "0x9ac64cc6e4415144c455bd8e4837fea55603e5c3";
  const rewardTokenAddress = process.env.REWARD_TOKEN_ADDRESS || "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const cvtcAddress = process.env.CVTC_ADDRESS || "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const wbnbAddress = process.env.WBNB_ADDRESS || "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
  const cvtcSwapAddress = process.env.CVTC_SWAP_ADDRESS || "0xab6C658f36697325c3E7FE5c81d12d73f6A341C6";

  console.log(`🔄 Router: ${routerAddress}`);
  console.log(`🎁 Reward Token: ${rewardTokenAddress}`);
  console.log(`🪙 CVTC: ${cvtcAddress}`);
  console.log(`💧 WBNB: ${wbnbAddress}`);
  console.log(`🔄 CVTC Swap: ${cvtcSwapAddress}`);

  const cvtcCompounderSimple = await CVTCCompounderSimple.deploy(
    routerAddress,
    rewardTokenAddress,
    cvtcAddress,
    wbnbAddress,
    cvtcSwapAddress
  );
  await cvtcCompounderSimple.deployed();

  console.log(`✅ CVTCCompounderSimple déployé à: ${cvtcCompounderSimple.address}`);

  // Sauvegarder l'adresse
  const fs = require("fs");
  const path = require("path");

  const envPath = path.join(__dirname, "../.env");
  let envContent = fs.readFileSync(envPath, "utf8");

  // Mettre à jour CVTC_COMPOUNDER_ADDRESS
  envContent = envContent.replace(
    /CVTC_COMPOUNDER_ADDRESS=0x[0-9a-fA-F]{40}/,
    `CVTC_COMPOUNDER_ADDRESS=${cvtcCompounderSimple.address}`
  );

  fs.writeFileSync(envPath, envContent);
  console.log(`💾 Adresse CVTCCompounderSimple mise à jour dans .env`);

  console.log("\n🎉 CVTCCompounderSimple déployé avec succès!");
  console.log(`🔍 Vérifier sur BSCScan: https://testnet.bscscan.com/address/${cvtcCompounderSimple.address}`);
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});