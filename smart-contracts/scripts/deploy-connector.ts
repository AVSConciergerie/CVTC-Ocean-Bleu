import { ethers } from "hardhat";

async function main() {
  console.log("🚀 DÉPLOIEMENT DU CVTC CONTRACT CONNECTOR");
  console.log("=========================================");

  // Récupérer le signer
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Déployeur: ${deployer.address}`);

  // Vérifier le solde
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Solde: ${ethers.formatEther(balance)} BNB`);

  // Déployer le contrat
  console.log("🔨 Déploiement en cours...");
  const CVTCContractConnector = await ethers.getContractFactory("CVTCContractConnector");
  const connector = await CVTCContractConnector.deploy();

  await connector.waitForDeployment();
  const connectorAddress = await connector.getAddress();

  console.log(`✅ Contrat déployé à: ${connectorAddress}`);

  // Vérifier le déploiement
  const owner = await connector.owner();
  console.log(`👑 Owner du contrat: ${owner}`);

  const supportedTypesCount = await connector.getSupportedTypesCount();
  console.log(`📋 Types supportés: ${supportedTypesCount}`);

  console.log("\n🎯 FONCTIONNALITÉS DISPONIBLES:");
  console.log("• connectContract() - Connecter un nouveau contrat");
  console.log("• disconnectContract() - Déconnecter un contrat");
  console.log("• transferToContract() - Transférer des fonds");
  console.log("• toggleContract() - Activer/désactiver un contrat");
  console.log("• addAuthorizedToken() - Autoriser de nouveaux tokens");

  console.log("\n📝 TYPES DE CONTRATS SUPPORTÉS:");
  console.log("• farm - Contrats de farming");
  console.log("• router - Routeurs DEX");
  console.log("• swap - Pools de swap");
  console.log("• compounder - Auto-compounders");
  console.log("• yield-farm - Farms de rendement");
  console.log("• lending - Protocoles de prêt");
  console.log("• staking - Contrats de staking");
  console.log("• bridge - Bridges cross-chain");

  console.log("\n🔗 PROCHAINES ÉTAPES:");
  console.log("1. Connecter des contrats existants:");
  console.log(`   connector.connectContract("swap", "0x9fD15619a90005468F02920Bb569c95759Da710C")`);
  console.log("2. Autoriser de nouveaux tokens");
  console.log("3. Transférer des fonds vers les contrats connectés");

  console.log("\n🎉 CONNECTOR OPÉRATIONNEL !");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});