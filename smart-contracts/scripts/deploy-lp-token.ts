import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Déploiement du token LP CVTC...");

  const [deployer] = await ethers.getSigners();
  console.log(`📋 Déploiement avec: ${deployer.address}`);

  // Déployer CVTCLPToken
  console.log("\n📄 Déploiement de CVTCLPToken...");
  const CVTCLPToken = await ethers.getContractFactory("CVTCLPToken");
  const cvtcLPToken = await CVTCLPToken.deploy();
  await cvtcLPToken.deployed();

  console.log(`✅ CVTCLPToken déployé à: ${cvtcLPToken.address}`);

  // Sauvegarder l'adresse
  const fs = require("fs");
  const path = require("path");

  const envPath = path.join(__dirname, "../.env");
  let envContent = fs.readFileSync(envPath, "utf8");

  // Mettre à jour LP_TOKEN_ADDRESS
  envContent = envContent.replace(
    /LP_TOKEN_ADDRESS=0x[0-9a-fA-F]{40}/,
    `LP_TOKEN_ADDRESS=${cvtcLPToken.address}`
  );

  fs.writeFileSync(envPath, envContent);
  console.log(`💾 Adresse LP Token mise à jour dans .env`);

  console.log("\n🎉 Token LP déployé avec succès!");
  console.log(`🔍 Vérifier sur BSCScan: https://testnet.bscscan.com/address/${cvtcLPToken.address}`);
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});