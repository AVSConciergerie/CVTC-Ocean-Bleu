import { ethers } from "hardhat";

async function main() {
  console.log("🧪 TEST DU CVTC CONTRACT CONNECTOR");
  console.log("==================================");

  // Adresse du connector (à remplacer après déploiement)
  const CONNECTOR_ADDRESS = "0x..."; // Remplacer par l'adresse réelle

  if (CONNECTOR_ADDRESS === "0x...") {
    console.log("❌ Veuillez remplacer CONNECTOR_ADDRESS par l'adresse réelle du connector déployé");
    return;
  }

  // Se connecter au connector
  const connector = await ethers.getContractAt("CVTCContractConnector", CONNECTOR_ADDRESS);

  console.log(`🔗 Connector: ${CONNECTOR_ADDRESS}`);

  // Test 1: Vérifier l'owner
  const owner = await connector.owner();
  console.log(`👑 Owner: ${owner}`);

  // Test 2: Lister les types supportés
  const supportedTypes = await connector.getSupportedTypes();
  console.log(`📋 Types supportés: ${supportedTypes.length}`);
  supportedTypes.forEach((type, index) => {
    console.log(`  ${index + 1}. ${type}`);
  });

  // Test 3: Vérifier les connexions actuelles
  console.log(`\n🔍 CONNEXIONS ACTUELLES:`);
  const [types, addresses, enabled] = await connector.getAllConnectedContracts();

  let connectedCount = 0;
  for (let i = 0; i < types.length; i++) {
    if (addresses[i] !== ethers.ZeroAddress) {
      console.log(`✅ ${types[i]}: ${addresses[i]} (${enabled[i] ? 'Actif' : 'Inactif'})`);
      connectedCount++;
    }
  }

  if (connectedCount === 0) {
    console.log(`❌ Aucun contrat connecté`);
  }

  // Test 4: Tester les fonctions de lecture
  console.log(`\n🧪 TESTS DES FONCTIONS:`);

  // Tester isContractActive
  const isSwapActive = await connector.isContractActive("swap");
  console.log(`🏦 Swap actif: ${isSwapActive}`);

  // Tester getContractAddress
  const swapAddress = await connector.getContractAddress("swap");
  console.log(`🏦 Adresse swap: ${swapAddress}`);

  // Test 5: Vérifier les tokens autorisés
  const cvtcToken = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const isCvtcAuthorized = await connector.authorizedTokens(cvtcToken);
  console.log(`💰 CVTC autorisé: ${isCvtcAuthorized}`);

  console.log(`\n🎉 TESTS TERMINÉS !`);

  if (connectedCount > 0) {
    console.log(`✅ Connector opérationnel avec ${connectedCount} contrat(s) connecté(s)`);
  } else {
    console.log(`⚠️ Connector déployé mais aucun contrat connecté`);
    console.log(`💡 Utilisez setup-connector.ts pour connecter les contrats existants`);
  }
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});