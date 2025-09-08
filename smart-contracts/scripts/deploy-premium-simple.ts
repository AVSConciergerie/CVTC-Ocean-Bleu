import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Déploiement du CVTCPremiumSimple (sans contraintes)...");

  const [deployer] = await ethers.getSigners();
  console.log(`📋 Déploiement avec: ${deployer.address}`);

  // Déployer CVTCPremiumSimple
  console.log("\n📄 Déploiement de CVTCPremiumSimple...");
  const CVTCPremiumSimple = await ethers.getContractFactory("CVTCPremiumSimple");

  const cvtcAddress = process.env.CVTC_ADDRESS || "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const cvtcSwapAddress = process.env.CVTC_SWAP_ADDRESS || "0xab6C658f36697325c3E7FE5c81d12d73f6A341C6";

  console.log(`🪙 CVTC Token: ${cvtcAddress}`);
  console.log(`🔄 CVTC Swap: ${cvtcSwapAddress}`);

  const cvtcPremiumSimple = await CVTCPremiumSimple.deploy(cvtcAddress, cvtcSwapAddress);
  await cvtcPremiumSimple.deployed();

  console.log(`✅ CVTCPremiumSimple déployé à: ${cvtcPremiumSimple.address}`);

  // Sauvegarder l'adresse
  const fs = require("fs");
  const path = require("path");

  const envPath = path.join(__dirname, "../.env");
  let envContent = fs.readFileSync(envPath, "utf8");

  // Mettre à jour CVTC_PREMIUM_ADDRESS
  envContent = envContent.replace(
    /CVTC_PREMIUM_ADDRESS=0x[0-9a-fA-F]{40}/,
    `CVTC_PREMIUM_ADDRESS=${cvtcPremiumSimple.address}`
  );

  fs.writeFileSync(envPath, envContent);
  console.log(`💾 Adresse CVTCPremiumSimple mise à jour dans .env`);

  // Mettre à jour le frontend aussi
  const frontendEnvPath = path.join(__dirname, "../../frontend/.env");
  if (fs.existsSync(frontendEnvPath)) {
    let frontendEnvContent = fs.readFileSync(frontendEnvPath, "utf8");
    frontendEnvContent = frontendEnvContent.replace(
      /VITE_CVTC_PREMIUM_ADDRESS=0x[0-9a-fA-F]{40}/,
      `VITE_CVTC_PREMIUM_ADDRESS=${cvtcPremiumSimple.address}`
    );
    fs.writeFileSync(frontendEnvPath, frontendEnvContent);
    console.log(`💾 Adresse mise à jour dans frontend/.env`);
  }

  console.log("\n🎉 CVTCPremiumSimple déployé avec succès !");
  console.log(`🔍 Vérifier sur BSCScan: https://testnet.bscscan.com/address/${cvtcPremiumSimple.address}`);

  console.log("\n✅ Fonctionnalités du nouveau contrat :");
  console.log("   • Transferts échelonnés SANS abonnement Premium");
  console.log("   • Tout le monde peut utiliser gratuitement");
  console.log("   • Mode test accéléré (15s = 1 mois)");
  console.log("   • Transferts immédiats pour < 1000 CVTC");
  console.log("   • Transferts échelonnés pour ≥ 1000 CVTC");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});