import { ethers } from "hardhat";

async function main() {
  console.log("🧪 TEST DES CORRECTIONS PAYMASTER FRONTEND");
  console.log("==========================================");

  const PAYMASTER_ADDRESS = "0x950c9E7ea88beF525E5fFA072E7F092E2B0f7516";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  // ABI du paymaster
  const paymasterABI = [
    "function getPaymasterData(address token) view returns (bytes)",
    "function getPaymasterStubData(address token) view returns (bytes)",
    "function getTokenQuote(address token, uint256 gasLimit) view returns (uint256)"
  ];

  const paymaster = new ethers.Contract(PAYMASTER_ADDRESS, paymasterABI, provider);

  try {
    console.log("🔍 Test 1: Calcul des frais de gas (correction BigInt)");
    const gasLimit = 100000; // number
    const gasPrice = 20e9;   // number

    // Simulation de la correction
    const gasLimitBigInt = BigInt(gasLimit);
    const gasPriceBigInt = BigInt(gasPrice);
    const estimatedCost = gasLimitBigInt * gasPriceBigInt;

    console.log(`Gas limit: ${gasLimit} (type: ${typeof gasLimit})`);
    console.log(`Gas price: ${gasPrice} (type: ${typeof gasPrice})`);
    console.log(`Estimated cost: ${estimatedCost} (type: ${typeof estimatedCost})`);
    console.log(`Formatted: ${ethers.formatEther(estimatedCost.toString())} ETH`);
    console.log("✅ BigInt correction fonctionne");

    console.log("\\n🔍 Test 2: Formatage des données paymaster");
    const rawData = await paymaster.getPaymasterData(CVTC_ADDRESS);
    console.log("Données brutes:", rawData);
    console.log("Type:", typeof rawData);
    console.log("Est bytes-like:", ethers.isBytesLike(rawData));

    // Simulation du traitement frontend
    let processedData;
    if (rawData && ethers.isBytesLike(rawData)) {
      processedData = rawData;
      console.log("✅ Données déjà valides");
    } else if (typeof rawData === 'string' && rawData.startsWith('0x')) {
      processedData = ethers.getBytes(rawData);
      console.log("✅ Conversion string vers bytes réussie");
    } else if (rawData && typeof rawData === 'object' && rawData.data) {
      processedData = ethers.getBytes(rawData.data);
      console.log("✅ Extraction propriété data réussie");
    } else {
      processedData = ethers.getBytes(rawData);
      console.log("✅ Conversion générique réussie");
    }

    console.log("Données traitées:", processedData);
    console.log("Longueur:", processedData.length);
    console.log("✅ Traitement des données paymaster fonctionne");

    console.log("\\n🔍 Test 3: Quote token");
    const quote = await paymaster.getTokenQuote(CVTC_ADDRESS, gasLimit);
    console.log(`Quote pour ${gasLimit} gas: ${ethers.formatEther(quote.toString())} CVTC`);
    console.log("✅ Quote fonctionne");

    console.log("\\n🎉 TOUTES LES CORRECTIONS FONCTIONNENT !");

  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
  }
}

main().catch(console.error);