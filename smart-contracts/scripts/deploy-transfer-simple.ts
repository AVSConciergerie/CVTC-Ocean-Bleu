import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Déploiement du CVTCTransferSimple (ultra-simple)...");

  const [deployer] = await ethers.getSigners();
  console.log(`📋 Déploiement avec: ${deployer.address}`);

  // Déployer CVTCTransferSimple
  console.log("\n📄 Déploiement de CVTCTransferSimple...");
  const CVTCTransferSimple = await ethers.getContractFactory("CVTCTransferSimple");

  const cvtcAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  console.log(`🪙 Token CVTC: ${cvtcAddress}`);

  const cvtcTransferSimple = await CVTCTransferSimple.deploy(cvtcAddress);
  await cvtcTransferSimple.deployed();

  console.log(`✅ CVTCTransferSimple déployé à: ${cvtcTransferSimple.address}`);

  // Sauvegarder l'adresse
  const fs = require("fs");
  const path = require("path");

  const envPath = path.join(__dirname, "../.env");
  let envContent = fs.readFileSync(envPath, "utf8");

  // Mettre à jour CVTC_PREMIUM_ADDRESS avec le nouveau contrat
  envContent = envContent.replace(
    /CVTC_PREMIUM_ADDRESS=0x[0-9a-fA-F]{40}/,
    `CVTC_PREMIUM_ADDRESS=${cvtcTransferSimple.address}`
  );

  fs.writeFileSync(envPath, envContent);
  console.log(`💾 Adresse CVTCTransferSimple mise à jour dans .env`);

  // Mettre à jour le frontend aussi
  const frontendEnvPath = path.join(__dirname, "../../frontend/.env");
  if (fs.existsSync(frontendEnvPath)) {
    let frontendEnvContent = fs.readFileSync(frontendEnvPath, "utf8");
    frontendEnvContent = frontendEnvContent.replace(
      /VITE_CVTC_PREMIUM_ADDRESS=0x[0-9a-fA-F]{40}/,
      `VITE_CVTC_PREMIUM_ADDRESS=${cvtcTransferSimple.address}`
    );
    fs.writeFileSync(frontendEnvPath, frontendEnvContent);
    console.log(`💾 Adresse mise à jour dans frontend/.env`);
  }

  console.log("\n🎉 CVTCTransferSimple déployé avec succès !");
  console.log(`🔍 Vérifier sur BSCScan: https://testnet.bscscan.com/address/${cvtcTransferSimple.address}`);

  console.log("\n✅ Fonctionnalités du nouveau contrat :");
  console.log("   • AUCUNE notion de Premium");
  console.log("   • Transferts immédiats pour < 1000 CVTC");
  console.log("   • Distribution géométrique pour ≥ 1000 CVTC (1, 2, 4, 8...)");
  console.log("   • Mode test accéléré (15s = 1 mois)");
  console.log("   • Ultra-simple et sans restrictions");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});