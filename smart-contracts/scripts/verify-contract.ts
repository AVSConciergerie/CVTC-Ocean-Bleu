import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Vérification de l'existence des contrats sur BSC Testnet...");

  const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  // Adresses à vérifier
  const contracts = {
    "CVTC Token": "0x532FC49071656C16311F2f89E6e41C53243355D3",
    "CVTC Premium": "0xA788393d86699cAeABBc78C6B2B5B53c84B39663",
    "CVTC Swap": "0xab6C658f36697325c3E7FE5c81d12d73f6A341C6",
    "CVTC Compounder": "0x6dA2e02a178fF7D790d5BaFcCD2C645d974c0f4e"
  };

  for (const [name, address] of Object.entries(contracts)) {
    try {
      console.log(`\n🔍 Vérification de ${name}...`);
      console.log(`   Adresse: ${address}`);

      const code = await provider.getCode(address);
      console.log(`   Code length: ${code.length} caractères`);

      if (code === '0x') {
        console.log(`   ❌ AUCUN CONTRAT trouvé à cette adresse`);
      } else {
        console.log(`   ✅ CONTRAT trouvé (${code.length} bytes)`);

        // Essayer de vérifier si c'est un contrat ERC20
        if (name === "CVTC Token") {
          try {
            const tokenContract = new ethers.Contract(address, [
              "function name() view returns (string)",
              "function symbol() view returns (string)",
              "function decimals() view returns (uint8)"
            ], provider);

            const tokenName = await tokenContract.name();
            const tokenSymbol = await tokenContract.symbol();
            const tokenDecimals = await tokenContract.decimals();

            console.log(`   📋 Token: ${tokenName} (${tokenSymbol}) - ${tokenDecimals} décimales`);
          } catch (tokenError: any) {
            console.log(`   ⚠️  Erreur lecture token: ${tokenError.message}`);
          }
        }
      }
    } catch (error: any) {
      console.log(`   ❌ Erreur de vérification: ${error.message}`);
    }
  }

  console.log("\n🎯 Vérification terminée!");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});