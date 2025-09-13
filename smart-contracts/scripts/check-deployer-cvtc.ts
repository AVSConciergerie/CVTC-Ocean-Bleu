import { ethers } from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./.env" });

async function main() {
  console.log("🔍 VÉRIFICATION DU SOLDE CVTC DU DÉPLOYEUR");
  console.log("==========================================");

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in .env");
    return;
  }

  // Configuration
  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
  const wallet = new ethers.Wallet(privateKey);

  // Adresses
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  // ABI du token CVTC
  const tokenABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
  ];

  const tokenContract = new ethers.Contract(cvtcTokenAddress, tokenABI, provider);

  try {
    // Informations du token
    const decimals = await tokenContract.decimals();
    const symbol = await tokenContract.symbol();
    console.log(`📊 Token: ${symbol} (${decimals} décimales)`);

    // Vérifier le solde du déployeur
    const deployerBalance = await tokenContract.balanceOf(wallet.address);
    console.log(`👤 Adresse déployeur: ${wallet.address}`);
    console.log(`💰 Solde CVTC: ${ethers.formatUnits(deployerBalance, decimals)} ${symbol}`);

    if (deployerBalance > 0) {
      console.log(`✅ Le déployeur a ${ethers.formatUnits(deployerBalance, decimals)} ${symbol}`);
      console.log(`🚀 Prêt pour approvisionner le pool de swap`);
    } else {
      console.log(`❌ Le déployeur n'a pas de ${symbol}`);
      console.log(`💡 Il faut d'abord obtenir des ${symbol} pour le déployeur`);
      console.log(`🔗 Token CVTC: ${cvtcTokenAddress}`);
    }

  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Erreur générale:", error);
  process.exitCode = 1;
});