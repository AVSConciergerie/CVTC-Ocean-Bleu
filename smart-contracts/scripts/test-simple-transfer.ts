import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Test de transfert simple de 199 CVTC...");

  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  // Adresses
  const transferContractAddress = "0x5762d5255e9ea84999c773C4D92Fa0E92CEEd4b1"; // CVTCTransferSimple
  const tokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const smartAccountAddress = "0x71438578893865F0664EdC067B10263c2CF92a1b";
  const recipientAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389"; // Destinataire de test

  // ABI du contrat de transfert
  const transferAbi = [
    "function transfer(address receiver, uint256 amount) external",
    "function getTransferStats() external view returns (uint256 totalTransfers, uint256 totalStaggeredReleases, uint256 activeTransfers)"
  ];

  // ABI du token CVTC
  const tokenAbi = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)"
  ];

  console.log("🔍 Configuration du test...");
  console.log(`📱 Smart Account: ${smartAccountAddress}`);
  console.log(`🎯 Destinataire: ${recipientAddress}`);
  console.log(`💰 Montant: 199 CVTC`);
  console.log(`🏢 Contrat: ${transferContractAddress}`);

  const transferContract = new ethers.Contract(transferContractAddress, transferAbi, provider);
  const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY manquante dans .env");
    return;
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("🔑 Wallet connecté:", wallet.address);

  try {
    // Vérifier le solde du Smart Account
    const balance = await tokenContract.balanceOf(smartAccountAddress);
    const formattedBalance = ethers.formatUnits(balance, 2);
    console.log(`💰 Solde Smart Account: ${formattedBalance} CVTC`);

    if (parseFloat(formattedBalance) < 199) {
      console.log("❌ Solde insuffisant pour le test");
      return;
    }

    // Vérifier l'allowance actuelle
    const currentAllowance = await tokenContract.allowance(smartAccountAddress, transferContractAddress);
    const formattedAllowance = ethers.formatUnits(currentAllowance, 2);
    console.log(`🔓 Allowance actuelle: ${formattedAllowance} CVTC`);

    // Approuver le contrat si nécessaire
    const testAmount = ethers.parseUnits("199", 2);
    if (currentAllowance < testAmount) {
      console.log("🔧 Approbation du contrat de transfert...");

      // Note: Dans un vrai Smart Account ERC-4337, cette approbation devrait être faite via une UserOperation
      // Pour ce test, nous simulons avec le wallet EOA
      const tokenWithWallet = tokenContract.connect(wallet);
      const approveTx = await tokenWithWallet.approve(transferContractAddress, testAmount);
      console.log("✅ Transaction d'approbation:", approveTx.hash);

      await approveTx.wait();
      console.log("✅ Approbation confirmée");
    }

    // Maintenant tester le transfert
    console.log("🚀 Initiation du transfert de 199 CVTC...");

    // Note: Dans un vrai Smart Account ERC-4337, cette transaction devrait être faite via une UserOperation
    // Pour ce test, nous simulons avec le wallet EOA
    const transferWithWallet = transferContract.connect(wallet);

    const transferTx = await transferWithWallet.transfer(recipientAddress, testAmount);
    console.log("✅ Transaction de transfert:", transferTx.hash);

    await transferTx.wait();
    console.log("✅ Transfert confirmé avec succès !");

    // Vérifier les statistiques du contrat
    const stats = await transferContract.getTransferStats();
    console.log("📊 Statistiques du contrat:");
    console.log(`   • Transferts totaux: ${stats[0]}`);
    console.log(`   • Libérations échelonnées: ${stats[1]}`);
    console.log(`   • Transferts actifs: ${stats[2]}`);

    // Vérifier le solde final
    const finalBalance = await tokenContract.balanceOf(smartAccountAddress);
    const formattedFinalBalance = ethers.formatUnits(finalBalance, 2);
    console.log(`💰 Solde final Smart Account: ${formattedFinalBalance} CVTC`);

    console.log("\n🎉 Test réussi ! Le système fonctionne parfaitement !");
    console.log("✅ Transfert immédiat de 199 CVTC effectué avec succès");

  } catch (error: any) {
    console.error("❌ Erreur lors du test:", error.message);

    if (error.message.includes("insufficient funds")) {
      console.log("💰 Erreur: Fonds insuffisants");
    } else if (error.message.includes("execution reverted")) {
      console.log("🔄 Erreur: Transaction rejetée par le contrat");
      console.log("   Cause possible: Smart Account ERC-4337 nécessite une UserOperation");
    } else if (error.message.includes("nonce")) {
      console.log("🔢 Erreur: Problème de nonce - réessayer");
    }
  }

  console.log("\n🎯 Test terminé!");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});