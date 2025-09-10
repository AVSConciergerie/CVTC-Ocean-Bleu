const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 TEST DES FONCTIONS PUBLIQUES DU CONTRAT");
  console.log("==========================================");

  const contractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83";
  const userAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";

  // ABI avec différentes fonctions potentielles
  const testABI = [
    // Fonctions ERC20 standard
    "function transfer(address to, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",

    // Fonctions du contrat CVTCPremium
    "function executeStaggeredRelease(uint256 transferId)",
    "function canExecuteRelease(uint256 transferId, address caller) view returns (bool)",
    "function getStaggeredTransferInfo(uint256 transferId) view returns (tuple)",
    "function getUserStaggeredTransfers(address user) view returns (uint256[])",

    // Fonctions de récupération
    "function emergencyCVTCReturn(address user, uint256 amount)",
    "function recoverLostTokens(address user, uint256 amount)",

    // Fonctions de base
    "function owner() view returns (address)",
    "function balanceOf(address) view returns (uint256)"
  ];

  const [signer] = await ethers.getSigners();
  const contract = new ethers.Contract(contractAddress, testABI, signer);

  console.log(`🎯 Test des fonctions sur: ${contractAddress}`);
  console.log(`👤 Avec l'adresse: ${userAddress}`);

  // Test 1: Vérifier les transferts échelonnés
  try {
    console.log("\n📋 1. Vérification des transferts échelonnés...");
    const userTransfers = await contract.getUserStaggeredTransfers(userAddress);
    console.log(`📊 Nombre de transferts échelonnés: ${userTransfers.length}`);

    if (userTransfers.length > 0) {
      for (let i = 0; i < userTransfers.length; i++) {
        const transferId = userTransfers[i];
        console.log(`🔍 Transfert ID ${transferId}:`);

        try {
          const canExecute = await contract.canExecuteRelease(transferId, userAddress);
          console.log(`   ✅ Peut exécuter: ${canExecute}`);

          if (canExecute) {
            console.log(`   🚀 Tentative d'exécution...`);
            const tx = await contract.executeStaggeredRelease(transferId);
            console.log(`   ✅ Transaction: ${tx.hash}`);
            await tx.wait();
            console.log(`   🎉 Transfert échelonné exécuté!`);
            return; // Sortir si réussi
          }
        } catch (error) {
          console.log(`   ❌ Erreur: ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.log(`❌ Erreur lors de la vérification des transferts: ${error.message}`);
  }

  // Test 2: Essayer transfer direct (si c'est un ERC20)
  try {
    console.log("\n📋 2. Test transfert ERC20 direct...");
    const tx = await contract.transfer(userAddress, ethers.parseUnits("3110.4", 2));
    console.log(`✅ Transfert ERC20 réussi: ${tx.hash}`);
    await tx.wait();
    console.log("🎉 Tokens récupérés!");
    return;
  } catch (error) {
    console.log(`❌ Transfert ERC20 échoué: ${error.message}`);
  }

  // Test 3: Essayer transferFrom
  try {
    console.log("\n📋 3. Test transferFrom...");
    const tx = await contract.transferFrom(contractAddress, userAddress, ethers.parseUnits("3110.4", 2));
    console.log(`✅ TransferFrom réussi: ${tx.hash}`);
    await tx.wait();
    console.log("🎉 Tokens récupérés!");
    return;
  } catch (error) {
    console.log(`❌ TransferFrom échoué: ${error.message}`);
  }

  console.log("\n❌ Aucune fonction publique n'a fonctionné.");
  console.log("💡 Solutions possibles:");
  console.log("1. 📞 Contacter le propriétaire du contrat: 0xb60a347C88F1F83Ba53dAA4ef5ab1D83C37CCEa9");
  console.log("2. 🛠️ Créer un contrat de récupération personnalisé");
  console.log("3. 🔍 Vérifier s'il y a d'autres fonctions disponibles sur BSCScan");
}

main().catch((error) => {
  console.error("❌ Erreur générale:", error);
  process.exitCode = 1;
});