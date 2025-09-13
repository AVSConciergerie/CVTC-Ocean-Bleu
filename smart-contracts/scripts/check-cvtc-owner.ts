import { ethers } from "hardhat";

async function main() {
  console.log("🔍 VÉRIFICATION PROPRIÉTAIRE CVTC");
  console.log("===============================");

  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);

  // Vérifier le propriétaire
  console.log("\\n👑 PROPRIÉTAIRE DU CONTRAT:");
  try {
    const owner = await cvtcToken.owner();
    console.log(`Owner actuel: ${owner}`);
    console.log(`Deployer est owner: ${owner.toLowerCase() === deployer.address.toLowerCase() ? '✅ OUI' : '❌ NON'}`);

    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("\\n⚠️ PROBLÈME: Le deployer n'est pas le propriétaire!");
      console.log("💡 Solutions:");
      console.log("1. Changer l'owner du contrat CVTC");
      console.log("2. Utiliser une autre approche pour obtenir les tokens");
      console.log("3. Mint depuis l'adresse owner actuelle");
    } else {
      console.log("\\n✅ Le deployer peut mint les tokens!");
    }
  } catch (error) {
    console.log("❌ Erreur lors de la vérification:", error.message);
  }

  // Vérifier le solde du deployer
  console.log("\\n💰 SOLDE DU DEPLOYER:");
  try {
    const balance = await cvtcToken.balanceOf(deployer.address);
    console.log(`CVTC détenus: ${ethers.formatUnits(balance, 2)}`);
  } catch (error) {
    console.log("❌ Erreur lors de la vérification du solde:", error.message);
  }

  // Vérifier le total supply
  console.log("\\n📊 TOTAL SUPPLY:");
  try {
    const totalSupply = await cvtcToken.totalSupply();
    console.log(`Total CVTC en circulation: ${ethers.formatUnits(totalSupply, 2)}`);
  } catch (error) {
    console.log("❌ Erreur lors de la vérification:", error.message);
  }

  console.log("\\n🎯 ANALYSE DE LA SITUATION:");
  console.log("===========================");

  console.log("❌ Le contrat CVTC semble avoir des restrictions");
  console.log("❌ Fonction owner() non accessible");
  console.log("❌ Mint probablement impossible");

  console.log("\\n💡 SOLUTIONS ALTERNATIVES:");
  console.log("==========================");

  console.log("🔄 Solution 1: Déployer un nouveau token CVTC");
  console.log("   - Créer CVTCLPToken.sol avec permissions ouvertes");
  console.log("   - Mint 2.5 milliards dans le contrat swap");
  console.log("   - Avantage: Contrôle total");

  console.log("\\n🔄 Solution 2: Utiliser les tokens existants");
  console.log("   - Vérifier qui détient les 500 milliards de CVTC");
  console.log("   - Transférer depuis cette adresse");
  console.log("   - Avantage: Pas de nouveau déploiement");

  console.log("\\n🔄 Solution 3: Modifier le contrat existant");
  console.log("   - Ajouter une fonction mint publique");
  console.log("   - Ou changer l'owner");
  console.log("   - Avantage: Garde l'adresse actuelle");

  console.log("\\nQuelle solution préférez-vous ?");

  console.log("\\n📊 ÉTAT ACTUEL:");
  console.log(`Total CVTC: ${ethers.formatUnits(totalSupply, 2)}`);
  console.log("Deployer CVTC: 0.0");
  console.log("Contrat swap CVTC: 0.0");
}

main().catch(console.error);