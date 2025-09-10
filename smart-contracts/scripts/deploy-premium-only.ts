import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Déploiement de CVTCPremium seulement...");

  const [deployer] = await ethers.getSigners();
  console.log(`📋 Déployeur: ${deployer.address}`);

  try {
    // Déploiement CVTCPremium
    console.log("\n👑 Déploiement CVTCPremium...");
    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");

    const cvtcAddress = process.env.CVTC_ADDRESS || "0x532FC49071656C16311F2f89E6e41C53243355D3";
    const cvtcSwapAddress = process.env.CVTC_SWAP_ADDRESS || "0xab6C658f36697325c3E7FE5c81d12d73f6A341C6";

    console.log(`🪙 CVTC Token: ${cvtcAddress}`);
    console.log(`🔄 CVTC Swap: ${cvtcSwapAddress}`);

    const cvtcPremium = await CVTCPremium.deploy(cvtcAddress, cvtcSwapAddress);
    await cvtcPremium.waitForDeployment();

    console.log(`✅ CVTCPremium déployé à: ${await cvtcPremium.getAddress()}`);

    // Mise à jour du .env
    const fs = require('fs');
    const path = require('path');

    const envPath = path.join(__dirname, "../.env");
    let envContent = fs.readFileSync(envPath, "utf8");

    // Mettre à jour CVTC_PREMIUM_ADDRESS
    const newAddress = await cvtcPremium.getAddress();
    envContent = envContent.replace(
      /CVTC_PREMIUM_ADDRESS=0x[0-9a-fA-F]{40}/,
      `CVTC_PREMIUM_ADDRESS=${newAddress}`
    );

    fs.writeFileSync(envPath, envContent);
    console.log(`💾 Adresse CVTCPremium mise à jour dans .env`);

    // Mise à jour du frontend
    const frontendEnvPath = path.join(__dirname, "../../frontend/.env");
    if (fs.existsSync(frontendEnvPath)) {
      let frontendEnvContent = fs.readFileSync(frontendEnvPath, "utf8");
      frontendEnvContent = frontendEnvContent.replace(
        /VITE_CVTC_PREMIUM_ADDRESS=0x[0-9a-fA-F]{40}/,
        `VITE_CVTC_PREMIUM_ADDRESS=${newAddress}`
      );
      fs.writeFileSync(frontendEnvPath, frontendEnvContent);
      console.log(`💾 Adresse mise à jour dans frontend/.env`);
    }

    console.log("\n🎉 CVTCPremium déployé avec succès !");
    console.log(`🔍 Vérifier sur BSCScan: https://testnet.bscscan.com/address/${newAddress}`);

    console.log("\n✅ Nouvelles fonctionnalités :");
    console.log("   • Distribution géométrique SANS limite d'étapes");
    console.log("   • Séquence continue jusqu'à épuisement des fonds");
    console.log("   • Exemple: 1001 CVTC → [1,2,4,8,16,32,64,128,256,490]");

  } catch (error: any) {
    console.log("❌ Erreur de déploiement:", error?.message || "Erreur inconnue");
  }
}

main().catch((error) => {
  console.error("❌ Erreur critique:", error);
  process.exitCode = 1;
});