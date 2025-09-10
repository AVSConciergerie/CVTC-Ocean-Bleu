const { ethers } = require("ethers");

async function main() {
  console.log("🔍 VÉRIFICATION DU PROPRIÉTAIRE DU CONTRAT");
  console.log("=========================================");

  const contractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83";
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const userAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";

  // ABI pour vérifier le propriétaire
  const ownerABI = [
    "function owner() view returns (address)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function getUserStaggeredTransfers(address) view returns (uint256[])",
    "function getStaggeredTransferInfo(uint256) view returns (tuple(address, address, uint256, uint256, uint256, uint256, uint256[], bool))",
    "function canExecuteRelease(uint256, address) view returns (bool)"
  ];

  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  try {
    const contract = new ethers.Contract(contractAddress, ownerABI, provider);

    // Vérifier le propriétaire
    let owner;
    try {
      owner = await contract.owner();
      console.log(`👑 Propriétaire du contrat: ${owner}`);
    } catch (error) {
      console.log("ℹ️ Le contrat n'a pas de fonction owner() - ce n'est pas un Ownable standard");
    }

    // Vérifier le solde du contrat dans le token CVTC
    const tokenContract = new ethers.Contract(cvtcTokenAddress, ["function balanceOf(address) view returns (uint256)"], provider);
    const contractBalance = await tokenContract.balanceOf(contractAddress);
    console.log(`🏦 Solde du contrat dans CVTC: ${ethers.formatUnits(contractBalance, 2)} CVTC`);

    // Vérifier si le contrat lui-même a des tokens
    try {
      const selfBalance = await contract.balanceOf(contractAddress);
      console.log(`🏠 Solde interne du contrat: ${ethers.formatUnits(selfBalance, 2)} tokens`);
    } catch (error) {
      console.log("ℹ️ Le contrat n'a pas de fonction balanceOf interne");
    }

    // Vérifier les transferts échelonnés de l'utilisateur
    try {
      const userStaggeredTransfers = await contract.getUserStaggeredTransfers(userAddress);
      console.log(`🔄 Transferts échelonnés de l'utilisateur: ${userStaggeredTransfers.length}`);
      for (let i = 0; i < userStaggeredTransfers.length; i++) {
        const transferId = userStaggeredTransfers[i];
        const transferInfo = await contract.getStaggeredTransferInfo(transferId);
        console.log(`  - Transfert ${transferId}: ${ethers.formatUnits(transferInfo.totalAmount, 2)} CVTC, restant: ${ethers.formatUnits(transferInfo.remainingAmount, 2)}, actif: ${transferInfo.isActive}`);
        if (transferInfo.isActive && transferInfo.currentStep < transferInfo.releaseSchedule.length) {
          const canExecute = await contract.canExecuteRelease(transferId, userAddress);
          console.log(`    Peut exécuter: ${canExecute}`);
        }
      }
    } catch (error) {
      console.log("ℹ️ Impossible de vérifier les transferts échelonnés:", error.message);
    }

    console.log("\n📋 RÉSUMÉ:");
    console.log(`- Contrat: ${contractAddress}`);
    console.log(`- Tokens CVTC détenus: ${ethers.formatUnits(contractBalance, 2)}`);
    console.log(`- Tu es le propriétaire: ${owner?.toLowerCase() === userAddress.toLowerCase() ? 'OUI' : 'NON'}`);

    if (contractBalance > 0) {
      console.log("\n🎯 PROCHAINES ÉTAPES POSSIBLES:");
      if (owner?.toLowerCase() === userAddress.toLowerCase()) {
        console.log("1. ✅ Tu es propriétaire - tu peux appeler les fonctions owner-only");
        console.log("2. 🔍 Cherche les fonctions 'emergencyCVTCReturn' ou 'recoverLostTokens'");
      } else {
        console.log("1. ❌ Tu n'es pas propriétaire du contrat");
        console.log("2. 🔍 Le propriétaire doit appeler les fonctions de transfert");
        console.log("3. 💡 Ou créer un nouveau contrat pour récupérer les tokens");
      }
    }

  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Erreur générale:", error);
  process.exitCode = 1;
});