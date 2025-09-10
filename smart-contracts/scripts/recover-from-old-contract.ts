import { ethers } from "hardhat";

async function main() {
  console.log("🚨 RÉCUPÉRATION DES TOKENS DEPUIS L'ANCIEN CONTRAT");
  console.log("==================================================");

  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  // Adresses
  const oldContractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83";
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const userAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";

  // ABI du token CVTC
  const tokenABI = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address, uint256) returns (bool)",
    "function transferFrom(address, address, uint256) returns (bool)"
  ];

  const tokenContract = new ethers.Contract(cvtcTokenAddress, tokenABI, signer);

  try {
    // Vérifier que nous sommes le propriétaire de l'ancien contrat
    console.log(`🔑 Notre adresse: ${signer.address}`);
    console.log(`🏠 Ancien contrat: ${oldContractAddress}`);

    // Vérifier le solde de l'ancien contrat
    const contractBalance = await tokenContract.balanceOf(oldContractAddress);
    console.log(`💰 Solde du contrat: ${ethers.formatUnits(contractBalance, 2)} CVTC`);

    if (contractBalance === 0n) {
      console.log("❌ Aucun token dans l'ancien contrat");
      return;
    }

    // Essayer de transférer directement les tokens
    console.log(`\n📤 Transfert de ${ethers.formatUnits(contractBalance, 2)} CVTC vers ${userAddress}...`);

    // Puisque nous sommes le propriétaire, nous pouvons transférer directement
    const tx = await tokenContract.transferFrom(oldContractAddress, userAddress, contractBalance);
    console.log(`✅ Transaction envoyée: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`🎉 Transaction confirmée dans le bloc ${receipt.blockNumber}`);

    // Vérifier le solde final
    const finalUserBalance = await tokenContract.balanceOf(userAddress);
    console.log(`🏆 Solde final de l'utilisateur: ${ethers.formatUnits(finalUserBalance, 2)} CVTC`);

    if (finalUserBalance >= contractBalance) {
      console.log(`\n🎯 SUCCÈS ! ${ethers.formatUnits(contractBalance, 2)} CVTC récupérés !`);
    }

  } catch (error: any) {
    console.error("❌ Erreur lors du transfert:", error.message);

    // Essayer une approche alternative
    console.log("\n🔄 Tentative avec transfert direct depuis le contrat...");

    try {
      // Créer une instance du contrat avec une ABI basique
      const basicABI = [
        "function transfer(address, uint256) returns (bool)"
      ];

      const contract = new ethers.Contract(oldContractAddress, basicABI, signer);
      const tx = await contract.transfer(userAddress, ethers.parseUnits("3110.4", 2));
      console.log(`✅ Transaction alternative envoyée: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`🎉 Transaction alternative confirmée dans le bloc ${receipt.blockNumber}`);

    } catch (altError: any) {
      console.error("❌ Échec de l'approche alternative:", altError.message);
      console.log("\n💡 Solution manuelle:");
      console.log("1. Aller sur https://testnet.bscscan.com/address/0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83");
      console.log("2. Connecter MetaMask");
      console.log("3. Utiliser 'Write Contract' avec la fonction transfer");
      console.log(`4. Destinataire: ${userAddress}`);
      console.log("5. Montant: 311040 (3110.4 CVTC avec 2 décimales)");
    }
  }
}

main().catch((error) => {
  console.error("❌ Erreur générale:", error);
  process.exitCode = 1;
});