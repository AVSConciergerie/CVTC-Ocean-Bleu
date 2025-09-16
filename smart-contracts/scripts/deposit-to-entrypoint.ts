import { ethers } from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./.env" });

async function main() {
  console.log("🏛️ DÉPÔT À L'ENTRYPOINT POUR LE PAYMASTER");
  console.log("=======================================");

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in .env");
    return;
  }

  // Configuration
  const provider = new ethers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");
  const wallet = new ethers.Wallet(privateKey, provider);
  const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
  const paymasterAddress = "0x950c9E7ea88beF525E5fFA072E7F092E2B0f7516";
  const amount = ethers.parseEther("0.1"); // 0.1 BNB

  console.log(`👤 Déployeur: ${wallet.address}`);
  console.log(`🏦 PayMaster: ${paymasterAddress}`);
  console.log(`⚡ EntryPoint: ${entryPointAddress}`);
  console.log(`💰 Montant à déposer: ${ethers.formatEther(amount)} BNB`);

  try {
    // Vérifier le solde
    const balance = await provider.getBalance(wallet.address);
    console.log(`💵 Solde déployeur: ${ethers.formatEther(balance)} BNB`);

    if (balance < amount) {
      console.error(`❌ Solde insuffisant: ${ethers.formatEther(balance)} < ${ethers.formatEther(amount)}`);
      console.log(`💡 Obtenez des BNB du faucet: https://testnet.binance.org/faucet-smart`);
      return;
    }

    // ABI de l'EntryPoint
    const entryPointABI = [
      "function depositTo(address account) payable",
      "function getDepositInfo(address account) view returns (uint256 deposit, uint256 staked, uint256 stake, uint256 unstakeDelaySec, uint256 withdrawTime)"
    ];
    const entryPointContract = new ethers.Contract(entryPointAddress, entryPointABI, wallet);

    // Vérifier le dépôt actuel
    const currentDeposit = await entryPointContract.getDepositInfo(paymasterAddress);
    console.log(`📊 Dépôt actuel: ${ethers.formatEther(currentDeposit[0])} BNB`);

    // Déposer
    console.log("🔄 Dépôt en cours...");
    const tx = await entryPointContract.depositTo(paymasterAddress, { value: amount });
    console.log(`📤 Transaction hash: ${tx.hash}`);

    await tx.wait();
    console.log("✅ Dépôt confirmé !");

    // Vérifier le nouveau dépôt
    const newDeposit = await entryPointContract.getDepositInfo(paymasterAddress);
    console.log(`📈 Nouveau dépôt: ${ethers.formatEther(newDeposit[0])} BNB`);

    console.log("\n🎉 Le paymaster peut maintenant sponsoriser les transactions gasless !");

  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Erreur générale:", error);
  process.exitCode = 1;
});