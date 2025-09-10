import { ethers } from "hardhat";

async function main() {
  console.log("💰 Vérification du solde CVTC dans le Smart Account...");

  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  // Adresses
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const smartAccountAddress = "0x71438578893865F0664EdC067B10263c2CF92a1b"; // Votre Smart Account

  // ABI du token CVTC
  const cvtcAbi = [
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)",
    "function name() external view returns (string)"
  ];

  console.log("🔍 Analyse du Smart Account...");
  console.log(`📱 Smart Account: ${smartAccountAddress}`);
  console.log(`🪙 Token CVTC: ${cvtcTokenAddress}`);

  const cvtcContract = new ethers.Contract(cvtcTokenAddress, cvtcAbi, provider);

  try {
    // Vérifier les informations du token
    const name = await cvtcContract.name();
    const symbol = await cvtcContract.symbol();
    const decimals = await cvtcContract.decimals();

    console.log(`📋 Token: ${name} (${symbol})`);
    console.log(`🔢 Décimales: ${decimals}`);

    // Vérifier le solde dans le Smart Account
    const balance = await cvtcContract.balanceOf(smartAccountAddress);
    const formattedBalance = ethers.formatUnits(balance, decimals);

    console.log(`\n💰 Solde CVTC dans le Smart Account:`);
    console.log(`   • Raw: ${balance.toString()} wei`);
    console.log(`   • Formatted: ${formattedBalance} ${symbol}`);

    if (parseFloat(formattedBalance) > 0) {
      console.log("✅ Le Smart Account a des CVTC !");
      console.log("🚀 Vous pouvez maintenant tester les transferts échelonnés !");

      // Suggestions de test
      console.log("\n🧪 Suggestions de test:");
      if (parseFloat(formattedBalance) < 1000) {
        console.log(`   • Test avec ${formattedBalance} CVTC → Transfert immédiat`);
      } else {
        console.log(`   • Test avec 500 CVTC → Transfert immédiat`);
        console.log(`   • Test avec 1500 CVTC → Distribution géométrique (1, 2, 4, 8...)`);
      }
    } else {
      console.log("❌ Le Smart Account n'a pas de CVTC");
      console.log("\n💡 Solutions pour obtenir des CVTC:");
      console.log("   1. Faucet BSC Testnet: https://testnet.binance.org/faucet-smart");
      console.log("   2. Échange sur PancakeSwap Testnet");
      console.log("   3. Demander à quelqu'un de vous envoyer des CVTC de test");
      console.log("   4. Utiliser un bridge depuis BSC Mainnet (si vous en avez)");
    }

    // Vérifier aussi le solde EOA pour comparaison
    const privateKey = process.env.PRIVATE_KEY;
    if (privateKey) {
      const wallet = new ethers.Wallet(privateKey, provider);
      const eoaBalance = await cvtcContract.balanceOf(wallet.address);
      const formattedEOABalance = ethers.formatUnits(eoaBalance, decimals);

      console.log(`\n🔄 Comparaison avec l'EOA:`);
      console.log(`   • EOA (${wallet.address.slice(-6)}): ${formattedEOABalance} ${symbol}`);
      console.log(`   • Smart Account: ${formattedBalance} ${symbol}`);

      if (parseFloat(formattedEOABalance) > 0 && parseFloat(formattedBalance) === 0) {
        console.log("\n💡 Vous pouvez transférer des CVTC de l'EOA vers le Smart Account !");
      }
    }

  } catch (error: any) {
    console.error("❌ Erreur lors de la vérification:", error.message);
  }

  console.log("\n🎯 Vérification terminée!");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});