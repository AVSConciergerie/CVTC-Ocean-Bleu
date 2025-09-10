import { ethers } from "hardhat";

async function main() {
  console.log("🔧 TRANSFERT MANUEL DES CVTC");
  console.log("=" .repeat(50));

  const userAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const contractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83";

  console.log(`👤 Destinataire: ${userAddress}`);
  console.log(`🪙 Token: ${cvtcTokenAddress}`);
  console.log(`🏢 Depuis: ${contractAddress}`);
  console.log("");

  // Calcul du montant (3110.4 CVTC avec 2 décimales)
  const amountToTransfer = 311040n; // 3110.4 * 10^2

  console.log("💰 DÉTAILS DU TRANSFERT :");
  console.log(`   Montant: ${amountToTransfer.toString()} wei`);
  console.log(`   Montant: ${Number(amountToTransfer) / Math.pow(10, 2)} CVTC`);
  console.log("");

  // Obtenir l'instance du token
  const cvtcToken = await ethers.getContractAt("IERC20", cvtcTokenAddress);

  // Vérifier le solde actuel
  const currentBalance = await cvtcToken.balanceOf(contractAddress);
  console.log(`📊 Solde actuel du contrat: ${currentBalance.toString()} wei`);
  console.log(`📊 Solde actuel du contrat: ${Number(currentBalance) / Math.pow(10, 2)} CVTC`);
  console.log("");

  if (currentBalance < amountToTransfer) {
    console.log("❌ SOLDE INSUFFISANT !");
    console.log(`❌ Manque: ${Number(amountToTransfer - currentBalance) / Math.pow(10, 2)} CVTC`);
    return;
  }

  console.log("✅ SOLDE SUFFISANT - Prêt pour le transfert");
  console.log("");

  console.log("🔨 TRANSACTION À EXÉCUTER :");
  console.log("-" .repeat(40));

  // Préparer les données de la transaction
  const transferData = cvtcToken.interface.encodeFunctionData("transfer", [userAddress, amountToTransfer]);

  console.log("📋 Paramètres de transaction :");
  console.log(`   • De: ${contractAddress}`);
  console.log(`   • À: ${cvtcTokenAddress}`);
  console.log(`   • Valeur: 0 BNB`);
  console.log(`   • Données: ${transferData}`);
  console.log("");

  console.log("🛠️ INSTRUCTIONS :");
  console.log("1. Connectez-vous à MetaMask avec l'adresse propriétaire du contrat");
  console.log("2. Allez sur https://testnet.bscscan.com/");
  console.log("3. Utilisez la fonction 'Write Contract' du contrat CVTC");
  console.log("4. Appelez la fonction 'transfer' avec ces paramètres :");
  console.log(`   - to: ${userAddress}`);
  console.log(`   - amount: ${amountToTransfer.toString()}`);
  console.log("");

  console.log("⚠️ ATTENTION : Cette transaction doit être exécutée par le propriétaire du contrat !");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });