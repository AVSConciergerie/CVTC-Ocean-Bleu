import { ethers } from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./.env" });

async function main() {
  console.log("🪙 MINT DE 2,5 MILLIARDS DE CVTC");
  console.log("===============================");

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in .env");
    return;
  }

  // Configuration
  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
  const wallet = new ethers.Wallet(privateKey, provider);

  // Adresses
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const swapContractAddress = "0x9fD15619a90005468F02920Bb569c95759Da710C";

  // ABI étendu du token CVTC (avec fonction mint si elle existe)
  const tokenABI = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address, uint256) returns (bool)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function mint(address, uint256) external", // Fonction mint si elle existe
    "function owner() view returns (address)", // Vérifier si nous sommes owner
    "function transferOwnership(address) external" // Changer owner si nécessaire
  ];

  const tokenContract = new ethers.Contract(cvtcTokenAddress, tokenABI, wallet);

  try {
    // Informations du token
    const decimals = await tokenContract.decimals();
    const symbol = await tokenContract.symbol();
    const name = await tokenContract.name();
    console.log(`📊 Token: ${name} (${symbol})`);
    console.log(`📏 Décimales: ${decimals}`);

    // Vérifier si nous sommes owner
    let owner: string;
    try {
      owner = await tokenContract.owner();
      console.log(`👑 Owner du token: ${owner}`);
      console.log(`🔑 Sommes-nous owner: ${owner.toLowerCase() === wallet.address.toLowerCase()}`);
    } catch (error) {
      console.log(`⚠️ Impossible de récupérer l'owner (fonction owner() non disponible)`);
    }

    // Montant phénoménal : 2,5 milliards de CVTC
    const amountToMint = ethers.parseUnits("2500000000", decimals); // 2.5 milliards
    console.log(`💰 Montant à mint: ${ethers.formatUnits(amountToMint, decimals)} ${symbol}`);
    console.log(`📈 Cela représente: ${(Number(ethers.formatUnits(amountToMint, decimals)) / 1000000).toFixed(2)} millions de ${symbol}`);

    // Essayer de mint directement
    console.log("🔄 Tentative de mint...");
    try {
      const mintTx = await tokenContract.mint(wallet.address, amountToMint);
      console.log(`📤 Transaction mint: ${mintTx.hash}`);
      await mintTx.wait();
      console.log("✅ Mint réussi !");

      // Vérifier le nouveau solde
      const newBalance = await tokenContract.balanceOf(wallet.address);
      console.log(`💰 Nouveau solde: ${ethers.formatUnits(newBalance, decimals)} ${symbol}`);

    } catch (mintError: any) {
      console.log(`❌ Mint direct impossible: ${mintError.message}`);

      // Essayer via BSCScan ou alternative
      console.log(`\n🔧 ALTERNATIVES:`);
      console.log(`1. Utiliser BSCScan pour mint:`);
      console.log(`   - Aller sur: https://testnet.bscscan.com/token/${cvtcTokenAddress}#writeContract`);
      console.log(`   - Fonction: mint(address,uint256)`);
      console.log(`   - to: ${wallet.address}`);
      console.log(`   - amount: ${amountToMint.toString()}`);

      console.log(`\n2. Demander à l'owner du token de mint pour vous`);

      console.log(`\n3. Utiliser un script alternatif si disponible`);
    }

  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Erreur générale:", error);
  process.exitCode = 1;
});