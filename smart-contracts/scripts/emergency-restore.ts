import { ethers } from "hardhat";

async function main() {
  console.log("🚨 RESTAURATION D'URGENCE DES CVTC");

  const contractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83";
  const userAddress = "0x1edb8dd2c5d6c25b7661316ae57c3e95e0cf6389"; // Adresse de l'utilisateur
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3"; // Adresse du token CVTC
  const amountToRestore = 311040n; // 3110.4 CVTC = 311040 wei (avec 2 décimales)

  console.log(`👤 Utilisateur: ${userAddress}`);
  console.log(`💰 Montant à restituer: ${Number(amountToRestore) / Math.pow(10, 2)} CVTC (${amountToRestore.toString()} wei)`);

  const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
  const contract = CVTCPremium.attach(contractAddress);

  // Vérifier le solde du contrat
  const cvtcToken = await ethers.getContractAt("IERC20", cvtcTokenAddress);
  const contractBalance = await cvtcToken.balanceOf(contractAddress);

  console.log(`📊 Solde du contrat: ${contractBalance.toString()} wei`);

  // Le token CVTC utilise 2 décimales (pas 18 comme les tokens standards)
  const contractBalanceCVTC = Number(contractBalance) / Math.pow(10, 2);
  console.log(`📊 Solde du contrat: ${contractBalanceCVTC} CVTC`);

  // Calculer le montant attendu avec 2 décimales
  const expectedBalance = BigInt(Math.floor(3110.4 * Math.pow(10, 2))); // 3110.4 * 100
  console.log(`🎯 Attendu: ${expectedBalance.toString()} wei`);
  console.log(`🎯 Attendu: ${Number(expectedBalance) / Math.pow(10, 2)} CVTC`);

  if (contractBalance < expectedBalance) {
    console.log("❌ Solde insuffisant dans le contrat");
    const missing = expectedBalance - contractBalance;
    console.log(`❌ Manque: ${Number(missing) / Math.pow(10, 2)} CVTC`);
    return;
  }

  console.log("🔄 Exécution du transfert direct...");

  try {
    // Au lieu d'utiliser emergencyCVTCReturn, on fait un transfert direct
    // Mais d'abord, il faut que le contrat approuve le transfert ou qu'on appelle directement transfer
    // Puisque c'est un script d'urgence, on va simuler l'appel du owner

    console.log("⚠️ Note: Ce script nécessite d'être exécuté par le propriétaire du contrat");
    console.log("🔧 Transfert direct des tokens...");

    // Pour l'instant, créons juste la transaction qui serait exécutée
    const transferData = cvtcToken.interface.encodeFunctionData("transfer", [userAddress, amountToRestore]);

    console.log("📋 Données de transaction préparées:");
    console.log(`   À: ${cvtcTokenAddress}`);
    console.log(`   Données: ${transferData}`);
    console.log(`   Montant: ${amountToRestore.toString()} wei (${Number(amountToRestore) / Math.pow(10, 2)} CVTC)`);

    // Essayer d'exécuter le transfert directement depuis le contrat
    // (Cela ne marchera que si on est le owner du contrat)
    try {
      const tx = await cvtcToken.transfer(userAddress, amountToRestore);
      await tx.wait();

      console.log("✅ Transfert réussi !");
      console.log(`📋 Transaction: ${tx.hash}`);

      // Vérification
      const newContractBalance = await cvtcToken.balanceOf(contractAddress);
      const newContractBalanceCVTC = Number(newContractBalance) / Math.pow(10, 2);
      console.log(`📊 Nouveau solde du contrat: ${newContractBalanceCVTC} CVTC`);

    } catch (transferError) {
      console.error("❌ Erreur lors du transfert direct:", transferError.message);
      console.log("💡 Solution: Le propriétaire du contrat doit exécuter manuellement le transfert");
    }

  } catch (error) {
    console.error("❌ Erreur générale:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });