import { ethers } from "hardhat";

async function main() {
  console.log("💸 FINANCEMENT OPÉRATEUR POUR SWAPS");
  console.log("===================================");

  const OPERATOR_ADDRESS = "0xb60a347C88F1F83Ba53dAA4ef5ab1D83C37CCEa9";
  const FUND_AMOUNT = ethers.parseEther("2.0"); // 2 BNB pour couvrir les swaps

  console.log(`👤 Adresse opérateur: ${OPERATOR_ADDRESS}`);
  console.log(`💰 Montant à transférer: ${ethers.formatEther(FUND_AMOUNT)} BNB`);

  const [deployer] = await ethers.getSigners();
  console.log(`🏦 Depuis: ${deployer.address}`);

  try {
    // Vérifier le solde du deployer
    const deployerBalance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Solde deployer: ${ethers.formatEther(deployerBalance)} BNB`);

    if (deployerBalance < FUND_AMOUNT) {
      console.log(`❌ Solde insuffisant: ${ethers.formatEther(FUND_AMOUNT - deployerBalance)} BNB manquants`);
      return;
    }

    // Vérifier le solde actuel de l'opérateur
    const operatorBalanceBefore = await ethers.provider.getBalance(OPERATOR_ADDRESS);
    console.log(`💰 Solde opérateur avant: ${ethers.formatEther(operatorBalanceBefore)} BNB`);

    // Transférer les fonds
    console.log("\\n🚀 Transfert en cours...");
    const tx = await deployer.sendTransaction({
      to: OPERATOR_ADDRESS,
      value: FUND_AMOUNT,
      gasLimit: 21000
    });

    await tx.wait();
    console.log(`✅ Transfert réussi! Hash: ${tx.hash}`);

    // Vérifier le nouveau solde
    const operatorBalanceAfter = await ethers.provider.getBalance(OPERATOR_ADDRESS);
    console.log(`💰 Solde opérateur après: ${ethers.formatEther(operatorBalanceAfter)} BNB`);

    const received = operatorBalanceAfter - operatorBalanceBefore;
    console.log(`📈 Reçu: ${ethers.formatEther(received)} BNB`);

    console.log("\\n🎉 OPÉRATEUR FINANCÉ AVEC SUCCÈS!");
    console.log("=================================");
    console.log("✅ Prêt pour exécuter les premiers swaps");
    console.log("✅ Capacité: ~200 swaps de 0.01 BNB");

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);