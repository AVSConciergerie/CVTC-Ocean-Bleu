import { ethers } from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./.env" });

async function main() {
  console.log("🌟 APPROVISIONNEMENT MASSIF DU POOL DE SWAP");
  console.log("==========================================");

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in .env");
    return;
  }

  // Configuration
  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
  const wallet = new ethers.Wallet(privateKey, provider);

  // Adresses
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const swapContractAddress = "0x9fD15619a90005468F02920Bb569c95759Da710C";

  // ABI du token CVTC
  const tokenABI = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address, uint256) returns (bool)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
  ];

  const tokenContract = new ethers.Contract(cvtcTokenAddress, tokenABI, wallet);

  try {
    // Informations du token
    const decimals = await tokenContract.decimals();
    const symbol = await tokenContract.symbol();
    console.log(`📊 Token: ${symbol} (${decimals} décimales)`);

    // Vérifier le solde actuel du déployeur
    const deployerBalance = await tokenContract.balanceOf(wallet.address);
    console.log(`👤 Solde déployeur: ${ethers.formatUnits(deployerBalance, decimals)} ${symbol}`);

    if (deployerBalance === 0n) {
      console.error(`❌ Le déployeur n'a pas de ${symbol}`);
      console.log(`💡 Utilisez d'abord le script de mint ou BSCScan pour obtenir des ${symbol}`);
      return;
    }

    // Montant phénoménal : 2,5 milliards de CVTC
    const amountToTransfer = ethers.parseUnits("2500000000", decimals); // 2.5 milliards
    console.log(`💰 Montant à transférer: ${ethers.formatUnits(amountToTransfer, decimals)} ${symbol}`);
    console.log(`📈 Cela représente: ${(Number(ethers.formatUnits(amountToTransfer, decimals)) / 1000000).toFixed(2)} millions de ${symbol}`);

    if (deployerBalance < amountToTransfer) {
      console.error(`❌ Solde insuffisant: ${ethers.formatUnits(deployerBalance, decimals)} < ${ethers.formatUnits(amountToTransfer, decimals)}`);
      console.log(`💡 Vous avez besoin de ${(Number(ethers.formatUnits(amountToTransfer - deployerBalance, decimals)) / 1000000).toFixed(2)} millions de ${symbol} supplémentaires`);
      return;
    }

    // Vérifier le solde actuel du pool
    const currentPoolBalance = await tokenContract.balanceOf(swapContractAddress);
    console.log(`🏦 Solde actuel du pool: ${ethers.formatUnits(currentPoolBalance, decimals)} ${symbol}`);

    // Transfert massif vers le contrat swap
    console.log("🔄 Transfert massif en cours...");
    const tx = await tokenContract.transfer(swapContractAddress, amountToTransfer);
    console.log(`📤 Transaction hash: ${tx.hash}`);

    await tx.wait();
    console.log("✅ Transfert réussi !");

    // Vérifier le nouveau solde du pool
    const newPoolBalance = await tokenContract.balanceOf(swapContractAddress);
    console.log(`🏦 Nouveau solde du pool: ${ethers.formatUnits(newPoolBalance, decimals)} ${symbol}`);

    // Vérifier le solde restant du déployeur
    const remainingBalance = await tokenContract.balanceOf(wallet.address);
    console.log(`👤 Solde restant déployeur: ${ethers.formatUnits(remainingBalance, decimals)} ${symbol}`);

    console.log("\n🎉 POOL DE SWAP APPROVISIONNÉ AVEC SUCCÈS !");
    console.log("🌟 Le système d'onboarding peut maintenant gérer des milliers d'utilisateurs !");
    console.log(`💎 Liquidité totale: ${(Number(ethers.formatUnits(newPoolBalance, decimals)) / 1000000).toFixed(2)} millions de ${symbol}`);

  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Erreur générale:", error);
  process.exitCode = 1;
});