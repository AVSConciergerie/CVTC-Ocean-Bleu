import { ethers } from "hardhat";

async function main() {
  console.log("🔍 VÉRIFICATION DU SOLDE DU WALLET");
  console.log("==================================");

  const [signer] = await ethers.getSigners();
  console.log(`👤 Wallet address: ${signer.address}`);

  const balance = await ethers.provider.getBalance(signer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} BNB`);
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});