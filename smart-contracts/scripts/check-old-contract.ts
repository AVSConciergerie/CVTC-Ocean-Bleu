import { ethers } from "hardhat";

async function main() {
  console.log("🔍 VÉRIFICATION DE L'ANCIEN CONTRAT");
  console.log("===================================");

  const provider = new ethers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");

  // Ancien contrat (d'après les scripts précédents)
  const oldContractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83";
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const userAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";

  // ABI du token CVTC
  const tokenABI = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address, uint256) returns (bool)"
  ];

  const tokenContract = new ethers.Contract(cvtcTokenAddress, tokenABI, provider);

  try {
    // Vérifier le solde de l'ancien contrat
    const oldContractBalance = await tokenContract.balanceOf(oldContractAddress);
    console.log(`🏢 Solde de l'ancien contrat (${oldContractAddress}): ${ethers.formatUnits(oldContractBalance, 2)} CVTC`);

    // Vérifier le solde de l'utilisateur
    const userBalance = await tokenContract.balanceOf(userAddress);
    console.log(`👤 Solde de l'utilisateur: ${ethers.formatUnits(userBalance, 2)} CVTC`);

    // Vérifier d'autres contrats potentiels
    const newContractAddress = "0x87bC38879D9786BD7Fd03737DaA52d3d0a7785FB";
    const newContractBalance = await tokenContract.balanceOf(newContractAddress);
    console.log(`🆕 Solde du nouveau contrat (${newContractAddress}): ${ethers.formatUnits(newContractBalance, 2)} CVTC`);

    if (oldContractBalance > 0) {
      console.log(`\n🎯 TROUVÉ ! ${ethers.formatUnits(oldContractBalance, 2)} CVTC dans l'ancien contrat`);
      console.log(`📍 Adresse: ${oldContractAddress}`);
    } else if (newContractBalance > 0) {
      console.log(`\n🎯 TROUVÉ ! ${ethers.formatUnits(newContractBalance, 2)} CVTC dans le nouveau contrat`);
      console.log(`📍 Adresse: ${newContractAddress}`);
    } else {
      console.log(`\n❌ Aucun contrat ne contient de tokens CVTC`);
      console.log(`🔍 Les tokens ont peut-être déjà été récupérés ou sont ailleurs`);
    }

  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Erreur générale:", error);
  process.exitCode = 1;
});