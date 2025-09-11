import { ethers } from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./.env" });

async function main() {
  console.log("📋 ADRESSES DU SYSTÈME CVTC");
  console.log("==========================");

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in .env");
    return;
  }

  // Adresse du déployeur
  const deployer = new ethers.Wallet(privateKey);
  console.log(`👤 Déployeur: ${deployer.address}`);

  // Adresses des contrats
  console.log(`\n🏦 PayMaster: 0x950c9E7ea88beF525E5fFA072E7F092E2B0f7516`);
  console.log(`🎯 CVTC Token: 0x532FC49071656C16311F2f89E6e41C53243355D3`);
  console.log(`⚡ EntryPoint: 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`);
  console.log(`🔄 CVTCSwap: 0x9fD15619a90005468F02920Bb569c95759Da710C`);
  console.log(`📝 CVTCOnboarding: 0xf3af730B6eaF257EC44b244d56F3073Fd6B593c5`);

  console.log(`\n🌐 Réseau: BSC Testnet (Chain ID: 97)`);
  console.log(`🔗 Explorer: https://testnet.bscscan.com/`);
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});