import { ethers } from "hardhat";

async function main() {
  console.log("🔍 VÉRIFICATION DU SOLDE DU PAYMASTER");
  console.log("====================================");

  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  // Adresses
  const paymasterAddress = "0x950c9E7ea88beF525E5fFA072E7F092E2B0f7516";
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  // ABI du token CVTC
  const tokenABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];

  const tokenContract = new ethers.Contract(cvtcTokenAddress, tokenABI, provider);

  let bnbBalance: bigint = 0n;
  let paymasterBalance: bigint = 0n;
  let deposit: bigint = 0n;
  let decimals: number = 18;

  try {
    console.log("🔍 Vérification du solde BNB...");
    // Vérifier le solde BNB du paymaster
    bnbBalance = await provider.getBalance(paymasterAddress);
    console.log(`💰 Solde BNB du paymaster: ${ethers.formatEther(bnbBalance)} BNB`);

    console.log("🔍 Vérification des décimales...");
    // Obtenir les décimales
    decimals = await tokenContract.decimals();
    console.log(`📊 Décimales du token: ${decimals}`);

    console.log("🔍 Vérification du solde CVTC...");
    // Vérifier le solde du paymaster
    paymasterBalance = await tokenContract.balanceOf(paymasterAddress);
    console.log(`🏦 Solde du paymaster: ${ethers.formatUnits(paymasterBalance, decimals)} CVTC`);

    console.log("🔍 Vérification du dépôt EntryPoint...");
    // Vérifier le dépôt EntryPoint
    const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
    const entryPointABI = ["function getDepositInfo(address) view returns (uint256 deposit, uint256 staked, uint256 stake, uint256 unstakeDelaySec, uint256 withdrawTime)"];
    const entryPointContract = new ethers.Contract(entryPointAddress, entryPointABI, provider);
    const depositInfo = await entryPointContract.getDepositInfo(paymasterAddress);
    [deposit] = depositInfo;
    console.log(`🏛️ Dépôt EntryPoint: ${ethers.formatEther(deposit)} BNB`);

  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
    console.error("Stack:", error.stack);
  }

  // Afficher les conclusions
  if (paymasterBalance > 0) {
    console.log(`\n✅ Le paymaster contient ${ethers.formatUnits(paymasterBalance, decimals)} CVTC`);
  } else {
    console.log(`\n❌ Le paymaster n'a pas de tokens CVTC`);
  }

  if (bnbBalance > 0) {
    console.log(`✅ Le paymaster a ${ethers.formatEther(bnbBalance)} BNB`);
  } else {
    console.log(`❌ Le paymaster n'a pas de BNB - IL FAUT LE FONDER AVEC DU BNB !`);
  }

  if (deposit > 0) {
    console.log(`✅ Le paymaster a déposé ${ethers.formatEther(deposit)} BNB à l'EntryPoint`);
  } else {
    console.log(`❌ Le paymaster n'a pas déposé de BNB à l'EntryPoint - IL FAUT APPELER deposit() !`);
  }
}

main().catch((error) => {
  console.error("❌ Erreur générale:", error);
  process.exitCode = 1;
});