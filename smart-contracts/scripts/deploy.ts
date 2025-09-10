import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  console.log("🚀 Déploiement du contrat CVTCTransferSimple...");

  // Adresse du token CVTC
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  if (!cvtcTokenAddress) {
    throw new Error("L'adresse du token CVTC n'est pas définie.");
  }

  const CVTCTransferSimple = await ethers.getContractFactory("CVTCTransferSimple");
  const transferSimple = await CVTCTransferSimple.deploy(cvtcTokenAddress);

  await transferSimple.waitForDeployment();

  const contractAddress = await transferSimple.getAddress();
  console.log("✅ Contrat CVTCTransferSimple déployé à l'adresse:", contractAddress);

  console.log("\n🎉 Déploiement terminé !");
  console.log("N'oubliez pas de mettre à jour cette nouvelle adresse dans votre application et vos scripts.");
}

main().catch((error) => {
  console.error("❌ Erreur lors du déploiement:", error);
  process.exitCode = 1;
});
