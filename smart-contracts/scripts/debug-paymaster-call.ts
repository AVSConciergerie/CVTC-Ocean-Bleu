import { ethers } from "hardhat";

async function main() {
  console.log("🔧 DEBUG APPEL PAYMASTER");
  console.log("========================");

  const PAYMASTER_ADDRESS = "0x950c9E7ea88beF525E5fFA072E7F092E2B0f7516";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  // ABI du paymaster
  const paymasterABI = [
    "function getPaymasterData(address token) view returns (bytes)",
    "function getPaymasterStubData(address token) view returns (bytes)"
  ];

  try {
    console.log("🔍 Création instance contrat...");
    const paymaster = new ethers.Contract(PAYMASTER_ADDRESS, paymasterABI, provider);
    console.log("✅ Contrat créé:", paymaster.address);

    console.log("🔍 Test appel direct...");
    console.log("Token:", CVTC_ADDRESS);
    console.log("Type token:", typeof CVTC_ADDRESS);

    // Test 1: Appel bas niveau
    console.log("\\n🔍 Test 1: populateTransaction");
    try {
      const populated = await paymaster.getPaymasterData.populateTransaction(CVTC_ADDRESS);
      console.log("✅ populateTransaction réussi:", populated);
    } catch (error) {
      console.log("❌ populateTransaction échoué:", error.message);
    }

    // Test 2: Call statique
    console.log("\\n🔍 Test 2: staticCall");
    try {
      const callData = paymaster.interface.encodeFunctionData("getPaymasterData", [CVTC_ADDRESS]);
      console.log("Call data:", callData);

      const result = await provider.call({
        to: PAYMASTER_ADDRESS,
        data: callData
      });
      console.log("✅ staticCall réussi:", result);
      console.log("Résultat décodé:", ethers.hexlify(result));
    } catch (error) {
      console.log("❌ staticCall échoué:", error.message);
    }

    // Test 3: Appel normal
    console.log("\\n🔍 Test 3: Appel normal");
    try {
      const result = await paymaster.getPaymasterData(CVTC_ADDRESS);
      console.log("✅ Appel normal réussi:", result);
      console.log("Type:", typeof result);
      console.log("Longueur:", result.length);
    } catch (error) {
      console.log("❌ Appel normal échoué:", error.message);
      console.log("Code:", error.code);
      console.log("Data:", error.data);
    }

  } catch (error: any) {
    console.error("❌ Erreur générale:", error.message);
  }
}

main().catch(console.error);