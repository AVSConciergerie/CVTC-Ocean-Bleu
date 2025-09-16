import { ethers } from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./.env" });

async function main() {
  console.log("🔍 VÉRIFICATION DU SOLDE CVTC DANS LE CONTRAT SWAP");
  console.log("================================================");

  const provider = new ethers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");

  // Adresses
  const swapContractAddress = "0x9fD15619a90005468F02920Bb569c95759Da710C";
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  // ABI du token CVTC
  const tokenABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)"
  ];

  const tokenContract = new ethers.Contract(cvtcTokenAddress, tokenABI, provider);

  try {
    // Informations du token
    const decimals = await tokenContract.decimals();
    const symbol = await tokenContract.symbol();
    const name = await tokenContract.name();

    console.log(`📊 Token: ${name} (${symbol})`);
    console.log(`📏 Décimales: ${decimals}`);

    // Vérifier le solde du contrat swap
    const swapBalance = await tokenContract.balanceOf(swapContractAddress);
    console.log(`🏦 Solde du contrat Swap: ${ethers.formatUnits(swapBalance, decimals)} ${symbol}`);

    // Informations supplémentaires
    if (swapBalance > 0) {
      console.log(`✅ Le pool contient ${ethers.formatUnits(swapBalance, decimals)} ${symbol}`);
      console.log(`💰 Valeur approximative: ${(Number(ethers.formatUnits(swapBalance, decimals)) * 1).toFixed(4)} USD (si 1 CVTC = 1 USD)`);
    } else {
      console.log(`❌ Le pool de swap n'a pas de ${symbol}`);
      console.log(`💡 Le pool doit être approvisionné avec des ${symbol} pour fonctionner`);
    }

    // Informations sur la liquidité
    console.log(`💧 État de la liquidité: ${swapBalance > 0 ? 'APPROVISIONNÉ' : 'VIDE'}`);
    console.log(`🔄 Pool prêt pour les swaps: ${swapBalance > 0 ? 'OUI' : 'NON'}`);

  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Erreur générale:", error);
  process.exitCode = 1;
});