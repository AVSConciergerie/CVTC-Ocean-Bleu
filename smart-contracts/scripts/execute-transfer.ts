import { ethers } from "hardhat";

async function main() {
  console.log("🚀 EXÉCUTION DU TRANSFERT DES CVTC");
  console.log("=" .repeat(50));

  // Adresses
  const userAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389"; // Adresse de l'utilisateur
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3"; // Token CVTC
  const contractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83"; // Contrat premium

  // Montant (3110.4 CVTC avec 2 décimales)
  const amountToTransfer = 311040n;

  console.log(`👤 Destinataire: ${userAddress}`);
  console.log(`💰 Montant: ${Number(amountToTransfer) / Math.pow(10, 2)} CVTC`);
  console.log("");

  try {
    // Créer un wallet avec la clé privée depuis .env
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("PRIVATE_KEY non trouvée dans .env");
    }

    const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`🎭 Wallet utilisé: ${wallet.address}`);
    console.log("");

    // Vérifier que c'est bien le propriétaire du contrat
    const expectedOwner = "0xb60a347C88F1F83Ba53dAA4ef5ab1D83C37CCEa9";
    if (wallet.address.toLowerCase() !== expectedOwner.toLowerCase()) {
      throw new Error(`Wallet ${wallet.address} n'est pas le propriétaire attendu ${expectedOwner}`);
    }

    console.log("✅ Wallet propriétaire vérifié");
    console.log("");

    // Vérifier le solde du contrat premium
    const premiumAbi = [
      "function emergencyCVTCReturn(address user, uint256 amount) external",
      "function cvtcToken() external view returns (address)"
    ];

    const premiumContract = new ethers.Contract(contractAddress, premiumAbi, wallet);

    // Obtenir l'adresse du token depuis le contrat
    const tokenAddressFromContract = await premiumContract.cvtcToken();
    console.log(`🪙 Adresse du token depuis le contrat: ${tokenAddressFromContract}`);

    // Vérifier le solde du contrat
    const tokenAbi = [
      "function balanceOf(address owner) view returns (uint256)"
    ];

    const tokenContract = new ethers.Contract(cvtcTokenAddress, tokenAbi, provider);
    const contractBalance = await tokenContract.balanceOf(contractAddress);

    console.log(`📊 Solde du contrat: ${contractBalance.toString()} wei`);
    console.log(`📊 Solde du contrat: ${Number(contractBalance) / Math.pow(10, 2)} CVTC`);

    if (contractBalance < amountToTransfer) {
      throw new Error(`Solde insuffisant: ${Number(contractBalance) / Math.pow(10, 2)} < ${Number(amountToTransfer) / Math.pow(10, 2)}`);
    }

    console.log("✅ Solde suffisant");
    console.log("");

    // Exécuter la fonction d'urgence sur le contrat premium
    console.log("🔄 Exécution de emergencyCVTCReturn...");

    const tx = await premiumContract.emergencyCVTCReturn(userAddress, amountToTransfer);

    console.log(`📋 Transaction envoyée: ${tx.hash}`);
    console.log("⏳ Attente de confirmation...");

    await tx.wait();

    console.log("✅ TRANSACTION RÉUSSIE !");
    console.log(`🎉 ${Number(amountToTransfer) / Math.pow(10, 2)} CVTC transférés à ${userAddress}`);

    // Vérification finale
    const finalBalance = await cvtcToken.balanceOf(contractAddress);
    console.log(`📊 Solde restant du contrat: ${Number(finalBalance) / Math.pow(10, 2)} CVTC`);

  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });