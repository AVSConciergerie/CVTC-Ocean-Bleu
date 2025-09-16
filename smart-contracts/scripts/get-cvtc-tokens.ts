import { ethers } from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./.env" });

async function main() {
  console.log("🪙 OBTENTION DE CVTC POUR LE DÉPLOYEUR");
  console.log("====================================");

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in .env");
    return;
  }

  // Configuration
  const provider = new ethers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`👤 Adresse du déployeur: ${wallet.address}`);
  console.log(`🌐 Réseau: BSC Testnet`);
  console.log(`🔗 Explorer: https://testnet.bscscan.com/`);

  console.log(`\n📋 INSTRUCTIONS POUR OBTENIR DES CVTC:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`1. Rendez-vous sur le BSC Testnet Explorer:`);
  console.log(`   https://testnet.bscscan.com/token/0x532FC49071656C16311F2f89E6e41C53243355D3`);
  console.log(``);
  console.log(`2. Cliquez sur "Write Contract" (si disponible)`);
  console.log(``);
  console.log(`3. Utilisez la fonction mint() si elle existe:`);
  console.log(`   - to: ${wallet.address}`);
  console.log(`   - amount: 1000000 (100 CVTC avec 2 décimales)`);
  console.log(``);
  console.log(`4. Ou demandez à quelqu'un de vous transférer des CVTC`);
  console.log(``);
  console.log(`5. Vérifiez votre solde:`);
  console.log(`   npx tsx scripts/check-deployer-cvtc.ts`);
  console.log(``);
  console.log(`6. Une fois les CVTC obtenus, approvisionnez le pool:`);
  console.log(`   npx tsx scripts/fund-swap-pool.ts`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  console.log(`\n💡 SOLUTIONS ALTERNATIVES:`);
  console.log(`• Utiliser un faucet CVTC si disponible`);
  console.log(`• Demander des tokens à l'équipe de développement`);
  console.log(`• Utiliser un exchange décentralisé pour acheter des CVTC`);

  console.log(`\n🎯 OBJECTIF:`);
  console.log(`Obtenir au moins 100 CVTC pour approvisionner le pool de swap`);
  console.log(`Cela permettra au système d'onboarding de fonctionner correctement`);
}

main().catch((error) => {
  console.error("❌ Erreur générale:", error);
  process.exitCode = 1;
});