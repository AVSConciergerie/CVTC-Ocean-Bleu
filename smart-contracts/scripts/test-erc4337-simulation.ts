import { ethers } from "hardhat";

async function main() {
  console.log("🧪 SIMULATION ERC-4337 AVEC PAYMASTER");
  console.log("====================================");

  const PAYMASTER_ADDRESS = "0x950c9E7ea88beF525E5fFA072E7F092E2B0f7516";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const ENTRY_POINT = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  // ABI du paymaster
  const paymasterABI = [
    "function getPaymasterData(address token) view returns (bytes)",
    "function getPaymasterStubData(address token) view returns (bytes)"
  ];

  const paymaster = new ethers.Contract(PAYMASTER_ADDRESS, paymasterABI, provider);

  try {
    console.log("🔍 Simulation de ce qui se passe dans l'app...");

    // 1. Obtenir les données paymaster (comme dans l'app)
    console.log("\\n1️⃣ Obtenir les données paymaster...");
    const paymasterData = await paymaster.getPaymasterData(CVTC_ADDRESS);
    console.log("📋 PaymasterData obtenu:", paymasterData);

    // 2. Simuler la conversion (comme dans PaymasterUtils)
    console.log("\\n2️⃣ Conversion des données...");
    let convertedData;
    if (typeof paymasterData === 'string') {
      convertedData = ethers.getBytes(paymasterData);
      console.log("✅ Converti en bytes depuis string");
    } else {
      convertedData = paymasterData;
      console.log("ℹ️ Déjà en format correct");
    }
    console.log("📋 Données converties:", convertedData);
    console.log("📋 Type:", typeof convertedData);
    console.log("📋 Longueur:", convertedData.length);

    // 3. Simuler la structure UserOperation
    console.log("\\n3️⃣ Création UserOperation simulée...");
    const recipient = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";
    const amount = ethers.parseUnits("10", 2); // 10 CVTC

    const userOp = {
      target: CVTC_ADDRESS,
      data: ethers.concat([
        "0xa9059cbb", // transfer function selector
        ethers.zeroPadValue(ethers.toBeHex(recipient, 20), 32),
        ethers.zeroPadValue(ethers.toBeHex(amount), 32)
      ]),
      value: 0n,
    };

    console.log("📋 UserOp créé:", {
      target: userOp.target,
      data: userOp.data,
      value: userOp.value
    });

    // 4. Simuler les paramètres pour sendTransaction
    console.log("\\n4️⃣ Simulation des paramètres sendTransaction...");
    const sendParams = {
      userOps: [userOp],
      paymaster: PAYMASTER_ADDRESS,
      paymasterData: convertedData,
    };

    console.log("📋 Paramètres sendTransaction:", {
      userOpsCount: sendParams.userOps.length,
      paymaster: sendParams.paymaster,
      paymasterData: sendParams.paymasterData,
      paymasterDataLength: sendParams.paymasterData.length
    });

    // 5. Test avec la nouvelle structure (getPaymasterData function)
    console.log("\\n5️⃣ Test avec fonction getPaymasterData...");
    const paymasterConfig = {
      getPaymasterData: async () => {
        console.log("🔄 getPaymasterData appelé");
        return convertedData;
      }
    };

    console.log("📋 Configuration paymaster:", {
      hasGetPaymasterData: typeof paymasterConfig.getPaymasterData === 'function'
    });

    console.log("\\n✅ SIMULATION TERMINÉE - Structure des données vérifiée");

  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
    console.error("Stack:", error.stack);
  }
}

main().catch(console.error);