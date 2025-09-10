import { ethers } from "hardhat";

async function main() {
  console.log("🔍 VÉRIFICATION DU SOLDE DU CONTRAT");
  console.log("====================================");

  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  // Adresses
  const contractAddress = "0x87bC38879D9786BD7Fd03737DaA52d3d0a7785FB";
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const userAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";

  // ABI du token CVTC
  const tokenABI = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address, uint256) returns (bool)"
  ];

  const tokenContract = new ethers.Contract(cvtcTokenAddress, tokenABI, provider);

  try {
    // Vérifier le solde du contrat
    const contractBalance = await tokenContract.balanceOf(contractAddress);
    console.log(`🏢 Solde du contrat: ${ethers.formatUnits(contractBalance, 2)} CVTC`);

    // Vérifier le solde de l'utilisateur
    const userBalance = await tokenContract.balanceOf(userAddress);
    console.log(`👤 Solde de l'utilisateur: ${ethers.formatUnits(userBalance, 2)} CVTC`);

    if (contractBalance > 0) {
      console.log(`\n✅ Le contrat contient ${ethers.formatUnits(contractBalance, 2)} CVTC`);
      console.log(`🎯 Ces tokens peuvent être récupérés !`);
    } else {
      console.log(`\n❌ Le contrat n'a pas de tokens CVTC`);
    }

  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Erreur générale:", error);
  process.exitCode = 1;
});