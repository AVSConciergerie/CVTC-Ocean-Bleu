import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Test de l'appel approve sur le token CVTC...");

  const provider = new ethers.providers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");

  // Adresses
  const tokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const premiumAddress = "0xA788393d86699cAeABBc78C6B2B5B53c84B39663";

  // ABI du token
  const tokenAbi = [
    {
      "constant": false,
      "inputs": [
        { "name": "_spender", "type": "address" },
        { "name": "_value", "type": "uint256" }
      ],
      "name": "approve",
      "outputs": [{ "name": "", "type": "bool" }],
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        { "name": "_owner", "type": "address" },
        { "name": "_spender", "type": "address" }
      ],
      "name": "allowance",
      "outputs": [{ "name": "", "type": "uint256" }],
      "type": "function"
    }
  ];

  console.log("🔍 Test de l'encodage de l'appel approve...");
  console.log("   Token:", tokenAddress);
  console.log("   Spender:", premiumAddress);
  console.log("   Amount: 1000000 (1 CVTC avec 2 décimales)");

  try {
    const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);

    // Test d'encodage
    const encodedData = tokenContract.interface.encodeFunctionData('approve', [premiumAddress, ethers.utils.parseUnits("1", 2)]);
    console.log("✅ Encodage réussi:", encodedData);

    // Test de décodage pour vérifier
    const decoded = tokenContract.interface.decodeFunctionData('approve', encodedData);
    console.log("✅ Décodage réussi:");
    console.log("   Spender:", decoded[0]);
    console.log("   Amount:", decoded[1].toString());

    // Vérifier que l'adresse du spender est valide
    if (ethers.utils.isAddress(premiumAddress)) {
      console.log("✅ Adresse du spender valide");
    } else {
      console.log("❌ Adresse du spender invalide");
    }

  } catch (error: any) {
    console.log("❌ Erreur lors du test:", error.message);
  }

  console.log("\n🎯 Test terminé!");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});