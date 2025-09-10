import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Vérification de l'existence du contrat CVTCTransferSimple...");

  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  // Adresse du contrat déployé
  const contractAddress = "0xAEfFf843E171A6f022F0D06Bfd85998275a8D2D6";

  console.log(`📍 Adresse à vérifier: ${contractAddress}`);

  try {
    // Vérifier si le contrat existe
    const code = await provider.getCode(contractAddress);
    console.log(`📋 Longueur du code: ${code.length} caractères`);

    if (code === '0x') {
      console.log('❌ AUCUN CODE trouvé à cette adresse');
      console.log('🔄 Le contrat n\'existe pas ou n\'est pas déployé');
      return;
    }

    if (code.length > 2) {
      console.log('✅ Code détecté - Le contrat existe !');

      // Essayer de récupérer des informations basiques
      const balance = await provider.getBalance(contractAddress);
      console.log(`💰 Solde du contrat: ${ethers.formatEther(balance)} BNB`);

      // Essayer d'appeler une fonction de lecture
      const tokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";
      const tokenAbi = [
        "function balanceOf(address) view returns (uint256)"
      ];

      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);
      const contractCVTCBalance = await tokenContract.balanceOf(contractAddress);
      console.log(`🪙 Solde CVTC du contrat: ${ethers.formatUnits(contractCVTCBalance, 2)} CVTC`);

    } else {
      console.log('⚠️ Code minimal détecté (peut-être un EOA)');
    }

  } catch (error: any) {
    console.error('❌ Erreur lors de la vérification:', error.message);

    if (error.message.includes('network')) {
      console.log('🌐 Problème de connexion réseau');
    } else if (error.message.includes('timeout')) {
      console.log('⏰ Timeout - vérifier la connexion');
    }
  }

  console.log('\n🎯 Vérification terminée');
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});