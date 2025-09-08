import { ethers } from "hardhat";

async function main() {
  console.log("📊 STATUT RAPIDE - CVTC OCEAN BLEU");
  console.log("=".repeat(60));

  // Vérification des variables d'environnement
  console.log("🔧 CONFIGURATION:");
  const contracts = {
    CVTC_SWAP: process.env.CVTC_SWAP_ADDRESS,
    CVTC_PREMIUM: process.env.CVTC_PREMIUM_ADDRESS,
    LOCK: process.env.LOCK_ADDRESS,
    CVTC_COMPOUNDER: process.env.CVTC_COMPOUNDER_ADDRESS
  };

  let deployed = 0;
  let total = 0;

  for (const [name, address] of Object.entries(contracts)) {
    total++;
    if (address && address !== "0x0000000000000000000000000000000000000000") {
      console.log(`   ✅ ${name}: ${address.slice(-6)}`);
      deployed++;
    } else {
      console.log(`   ❌ ${name}: NON DÉPLOYÉ`);
    }
  }

  console.log(`\n📈 État: ${deployed}/${total} contrats déployés`);

  // Vérification des fonds
  console.log("\n💰 FONDS DISPONIBLES:");
  try {
    const privateKey = process.env.PRIVATE_KEY;
    if (privateKey) {
      const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
      const wallet = new ethers.Wallet(privateKey, provider);
      const balance = await provider.getBalance(wallet.address);

      console.log(`   📤 Adresse: ${wallet.address.slice(-6)}`);
      console.log(`   💰 Solde: ${ethers.utils.formatEther(balance)} BNB`);

      if (balance < ethers.utils.parseEther("0.01")) {
        console.log("   ⚠️  Solde faible - Risque d'échec de déploiement");
      } else {
        console.log("   ✅ Fonds suffisants");
      }
    } else {
      console.log("   ❌ PRIVATE_KEY manquante");
    }
  } catch (error) {
    console.log("   ❌ Erreur vérification fonds");
  }

  // Vérification ERC-4337
  console.log("\n🔗 ERC-4337:");
  const apiKey = process.env.PIMLICO_API_KEY;
  const rpcUrl = process.env.PIMLICO_RPC_URL;

  console.log(`   🔑 API Key: ${apiKey ? "✅" : "❌"}`);
  console.log(`   🌐 RPC URL: ${rpcUrl ? "✅" : "❌"}`);

  // Recommandations
  console.log("\n🎯 RECOMMANDATIONS:");

  if (deployed === total) {
    console.log("   ✅ Tous les contrats déployés - Prêt pour tests !");
    console.log("   🚀 Lance: npx hardhat run scripts/run-all-tests.ts --network bscTestnet");
  } else {
    console.log("   ⚠️  Contrats manquants - Déploiement requis");
    console.log("   🚀 Lance: npx hardhat run scripts/deploy-all.ts --network bscTestnet");
  }

  if (deployed > 0) {
    console.log("   🧪 Tests possibles:");
    console.log("      • npx hardhat run scripts/demo-accelerated.ts --network bscTestnet");
    console.log("      • npx hardhat run scripts/test-sender-pays-receiver-receives.ts --network bscTestnet");
  }

  console.log("\n⏰ Mode accéléré: 15 secondes = 1 mois activé !");
  console.log("=".repeat(60));
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});