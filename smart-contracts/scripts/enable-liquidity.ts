import { ethers } from "hardhat";

async function main() {
  console.log("🔄 ACTIVATION LIQUIDITÉ");
  console.log("=======================");

  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";

  console.log(`📍 Contrat swap: ${SWAP_ADDRESS}`);

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  try {
    // Vérifier le statut actuel
    const liquidityEnabled = await swapContract.liquidityEnabled();
    console.log(`🔄 Statut actuel: ${liquidityEnabled ? 'Activée' : 'Désactivée'}`);

    if (!liquidityEnabled) {
      console.log("\\n🚀 Activation de la liquidité...");

      // Activer la liquidité
      const tx = await swapContract.toggleLiquidity();
      await tx.wait();

      console.log("✅ Transaction réussie!");
      console.log(`🔗 Hash: ${tx.hash}`);

      // Vérifier que c'est bien activé
      const newStatus = await swapContract.liquidityEnabled();
      console.log(`🔄 Nouveau statut: ${newStatus ? 'Activée' : 'Désactivée'}`);

      if (newStatus) {
        console.log("\\n🎉 LIQUIDITÉ ACTIVÉE AVEC SUCCÈS!");
        console.log("=================================");
        console.log("✅ Prêt pour l'initialisation exceptionnelle");
        console.log("✅ Fonction emergencyInitWithTransfer() disponible");
      } else {
        console.log("\\n❌ ÉCHEC DE L'ACTIVATION");
      }

    } else {
      console.log("\\n✅ La liquidité est déjà activée");
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);