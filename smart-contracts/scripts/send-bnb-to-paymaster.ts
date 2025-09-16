import { ethers } from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./.env" });

async function main() {
  console.log("💸 ENVOI DE 0.1 BNB AU PAYMASTER");
  console.log("===============================");

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in .env");
    return;
  }

  // Configuration
  const provider = new ethers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");
  const wallet = new ethers.Wallet(privateKey, provider);
  const paymasterAddress = "0x950c9E7ea88beF525E5fFA072E7F092E2B0f7516";
  const amount = ethers.parseEther("0.1"); // 0.1 BNB

  console.log(`👤 Expéditeur: ${wallet.address}`);
  console.log(`🏦 Destinataire: ${paymasterAddress}`);
  console.log(`💰 Montant: ${ethers.formatEther(amount)} BNB`);

  try {
    // Vérifier le solde
    const balance = await provider.getBalance(wallet.address);
    console.log(`💵 Solde actuel: ${ethers.formatEther(balance)} BNB`);

    if (balance < amount) {
      console.error(`❌ Solde insuffisant: ${ethers.formatEther(balance)} < ${ethers.formatEther(amount)}`);
      console.log(`💡 Obtenez des BNB du faucet: https://testnet.binance.org/faucet-smart`);
      return;
    }

    // Envoyer la transaction
    console.log("🔄 Envoi en cours...");
    const tx = await wallet.sendTransaction({
      to: paymasterAddress,
      value: amount,
      gasLimit: 21000
    });

    console.log(`📤 Transaction hash: ${tx.hash}`);
    console.log("⏳ Attente de confirmation...");

    await tx.wait();
    console.log("✅ Transaction confirmée !");

    // Vérifier le nouveau solde du paymaster
    const newPaymasterBalance = await provider.getBalance(paymasterAddress);
    console.log(`🏦 Nouveau solde paymaster: ${ethers.formatEther(newPaymasterBalance)} BNB`);

  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Erreur générale:", error);
  process.exitCode = 1;
});