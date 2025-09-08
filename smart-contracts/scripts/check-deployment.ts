import { ethers } from "hardhat";

async function main() {
  console.log("🔍 VÉRIFICATION DU STATUT DES CONTRATS SUR BSC TESTNET");
  console.log("=".repeat(60));

  const contractAddresses = {
    CVTC_SWAP_ADDRESS: process.env.CVTC_SWAP_ADDRESS,
    CVTC_PREMIUM_ADDRESS: process.env.CVTC_PREMIUM_ADDRESS,
    LOCK_ADDRESS: process.env.LOCK_ADDRESS,
    CVTC_COMPOUNDER_ADDRESS: process.env.CVTC_COMPOUNDER_ADDRESS,
  };

  console.log("📋 Adresses configurées dans .env:");
  Object.entries(contractAddresses).forEach(([name, address]) => {
    console.log(`   ${name}: ${address}`);
  });

  console.log("\n🔎 Vérification sur BSC Testnet...");

  const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  let deployedCount = 0;
  let totalCount = 0;

  for (const [name, address] of Object.entries(contractAddresses)) {
    totalCount++;

    if (!address || address === "0x0000000000000000000000000000000000000000") {
      console.log(`❌ ${name}: NON DÉPLOYÉ (adresse zéro ou undefined)`);
      continue;
    }

    try {
      // Vérifier si le contrat existe en récupérant son code
      const code = await provider.getCode(address);
      if (code === "0x") {
        console.log(`❌ ${name}: CONTRAT NON TROUVÉ à ${address}`);
      } else {
        console.log(`✅ ${name}: DÉPLOYÉ à ${address}`);
        deployedCount++;

        // Essayer de récupérer des infos de base
        try {
          if (name === "CVTC_PREMIUM_ADDRESS") {
            const contract = new ethers.Contract(address, [
              "function STAGGERED_THRESHOLD() view returns (uint256)",
              "function MAX_STAGGERED_STEPS() view returns (uint256)"
            ], provider);

            const threshold = await contract.STAGGERED_THRESHOLD();
            const maxSteps = await contract.MAX_STAGGERED_STEPS();

            console.log(`   📊 Seuil échelonnement: ${ethers.utils.formatEther(threshold)} CVTC`);
            console.log(`   ⏱️  Maximum d'étapes: ${maxSteps}`);
          }
        } catch (error) {
          console.log(`   ⚠️  Impossible de récupérer les infos du contrat`);
        }
      }
    } catch (error: any) {
      console.log(`❌ ${name}: ERREUR lors de la vérification - ${error?.message || "Erreur inconnue"}`);
    }
  }

  console.log("\n📊 RÉSULTAT FINAL:");
  console.log(`   • Contrats déployés: ${deployedCount}/${totalCount}`);
  console.log(`   • Statut: ${deployedCount === totalCount ? "✅ TOUS DÉPLOYÉS" : "❌ DÉPLOIEMENT INCOMPLET"}`);

  if (deployedCount === 0) {
    console.log("\n🚀 ACTION RECOMMANDÉE:");
    console.log("   Lancez le déploiement complet:");
    console.log("   npx hardhat run scripts/deploy-all.ts --network bscTestnet");
  } else if (deployedCount < totalCount) {
    console.log("\n🔧 ACTION RECOMMANDÉE:");
    console.log("   Redéployez les contrats manquants:");
    console.log("   npx hardhat run scripts/deploy-all.ts --network bscTestnet");
    console.log("   Puis mettez à jour les adresses dans .env");
  }

  console.log("\n🔗 Liens BSCScan Testnet:");
  Object.entries(contractAddresses).forEach(([name, address]) => {
    if (address !== "0x0000000000000000000000000000000000000000") {
      console.log(`   ${name}: https://testnet.bscscan.com/address/${address}`);
    }
  });
}

main().catch((error) => {
  console.error("❌ Erreur lors de la vérification:", error);
  process.exitCode = 1;
});