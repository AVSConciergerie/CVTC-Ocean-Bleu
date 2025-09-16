import { ethers } from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./.env" });

async function main() {
  console.log("💰 FONDATION DU PAYMASTER");
  console.log("========================");

  const provider = new ethers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");
  const privateKey = process.env.PRIVATE_KEY;
  console.log("🔍 Chargement de la clé privée...");
  console.log("PRIVATE_KEY exists:", !!privateKey);
  if (privateKey) {
    console.log("Key length:", privateKey.length);
  }

  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in .env");
    return;
  }

  console.log("🔑 Clé privée trouvée");
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log(`👤 Utilisateur: ${wallet.address}`);

  // Adresses
  const paymasterAddress = "0x950c9E7ea88beF525E5fFA072E7F092E2B0f7516";
  const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

  // Montant à déposer (0.1 BNB)
  const depositAmount = ethers.parseEther("0.1");
  console.log(`💸 Montant à déposer: ${ethers.formatEther(depositAmount)} BNB`);

  try {
    console.log("🔍 Vérification du solde...");
    // Vérifier le solde de l'utilisateur
    const userBalance = await provider.getBalance(wallet.address);
    console.log(`💰 Solde utilisateur: ${ethers.formatEther(userBalance)} BNB`);

    if (userBalance < depositAmount) {
      console.error(`❌ Solde insuffisant: ${ethers.formatEther(userBalance)} < ${ethers.formatEther(depositAmount)}`);
      return;
    }

    // ABI de l'EntryPoint
    const entryPointABI = [
      "function depositTo(address account) payable",
      "function getDepositInfo(address account) view returns (uint256 deposit, uint256 staked, uint256 stake, uint256 unstakeDelaySec, uint256 withdrawTime)"
    ];

    const entryPointContract = new ethers.Contract(entryPointAddress, entryPointABI, wallet);

    console.log("🔄 Dépôt en cours...");
    // Déposer BNB pour le paymaster
    const tx = await entryPointContract.depositTo(paymasterAddress, { value: depositAmount });
    console.log(`📤 Transaction: ${tx.hash}`);

    await tx.wait();
    console.log("✅ Dépôt réussi !");

    // Vérifier le dépôt
    const [deposit] = await entryPointContract.getDepositInfo(paymasterAddress);
    console.log(`🏛️ Nouveau dépôt EntryPoint: ${ethers.formatEther(deposit)} BNB`);

  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Erreur générale:", error);
  process.exitCode = 1;
});