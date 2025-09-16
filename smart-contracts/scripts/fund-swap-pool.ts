import { ethers } from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./.env" });

async function main() {
  console.log("💰 APPROVISIONNEMENT DU POOL DE SWAP AVEC CVTC");
  console.log("=============================================");

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in .env");
    return;
  }

  // Configuration
  const provider = new ethers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");
  const wallet = new ethers.Wallet(privateKey, provider);

  // Adresses
  const swapContractAddress = "0x9fD15619a90005468F02920Bb569c95759Da710C";
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  // ABI du token CVTC
  const tokenABI = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address, uint256) returns (bool)",
    "function approve(address, uint256) returns (bool)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
  ];

  const tokenContract = new ethers.Contract(cvtcTokenAddress, tokenABI, wallet);

  try {
    // Informations du token
    const decimals = await tokenContract.decimals();
    const symbol = await tokenContract.symbol();
    console.log(`📊 Token: ${symbol} (${decimals} décimales)`);

    // Vérifier le solde du déployeur
    const deployerBalance = await tokenContract.balanceOf(wallet.address);
    console.log(`👤 Solde déployeur: ${ethers.formatUnits(deployerBalance, decimals)} ${symbol}`);

    if (deployerBalance === 0n) {
      console.error(`❌ Le déployeur n'a pas de ${symbol}`);
      console.log(`💡 Vous devez d'abord obtenir des ${symbol} pour le déployeur`);
      return;
    }

    // Montant à ajouter au pool (par exemple 100 CVTC)
    const amountToAdd = ethers.parseUnits("100", decimals);
    console.log(`💸 Montant à ajouter: ${ethers.formatUnits(amountToAdd, decimals)} ${symbol}`);

    if (deployerBalance < amountToAdd) {
      console.error(`❌ Solde insuffisant: ${ethers.formatUnits(deployerBalance, decimals)} < ${ethers.formatUnits(amountToAdd, decimals)}`);
      return;
    }

    // Transfert des tokens vers le contrat swap
    console.log("🔄 Transfert en cours...");
    const tx = await tokenContract.transfer(swapContractAddress, amountToAdd);
    console.log(`📤 Transaction hash: ${tx.hash}`);

    await tx.wait();
    console.log("✅ Transfert confirmé !");

    // Vérifier le nouveau solde du pool
    const newPoolBalance = await tokenContract.balanceOf(swapContractAddress);
    console.log(`🏦 Nouveau solde du pool: ${ethers.formatUnits(newPoolBalance, decimals)} ${symbol}`);

    console.log("\n🎉 Le pool de swap est maintenant approvisionné !");
    console.log("🔄 Le système d'onboarding peut maintenant fonctionner");

  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Erreur générale:", error);
  process.exitCode = 1;
});