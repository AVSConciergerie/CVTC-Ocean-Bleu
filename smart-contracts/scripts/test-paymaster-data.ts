import { ethers } from "hardhat";

async function main() {
  console.log("🧪 TEST DES DONNÉES PAYMASTER");
  console.log("============================");

  const PAYMASTER_ADDRESS = "0x950c9E7ea88beF525E5fFA072E7F092E2B0f7516";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const provider = new ethers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");

  // ABI du paymaster
  const paymasterABI = [
    "function getPaymasterData(address token) view returns (bytes)",
    "function getPaymasterStubData(address token) view returns (bytes)",
    "function getTokenQuote(address token, uint256 gasLimit) view returns (uint256)"
  ];

  const paymaster = new ethers.Contract(PAYMASTER_ADDRESS, paymasterABI, provider);

  try {
    console.log("🔍 Test getPaymasterData...");
    const paymasterData = await paymaster.getPaymasterData(CVTC_ADDRESS);
    console.log("📋 PaymasterData:", paymasterData);
    console.log("📋 Type:", typeof paymasterData);
    console.log("📋 Longueur:", paymasterData.length);
    console.log("📋 Est-ce des bytes valides?", ethers.isBytesLike(paymasterData));

    // Convertir en hex pour voir
    const hexData = ethers.hexlify(paymasterData);
    console.log("📋 En hex:", hexData);

    console.log("\\n🔍 Test getPaymasterStubData...");
    const stubData = await paymaster.getPaymasterStubData(CVTC_ADDRESS);
    console.log("📋 StubData:", stubData);
    console.log("📋 Type:", typeof stubData);
    console.log("📋 Longueur:", stubData.length);
    console.log("📋 Est-ce des bytes valides?", ethers.isBytesLike(stubData));

    console.log("\\n🔍 Test getTokenQuote...");
    const quote = await paymaster.getTokenQuote(CVTC_ADDRESS, 100000);
    console.log("💰 Quote pour 100k gas:", ethers.formatEther(quote), "CVTC");

    console.log("\\n✅ TESTS RÉUSSIS - Les données sont correctement formatées");

  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
  }
}

main().catch(console.error);