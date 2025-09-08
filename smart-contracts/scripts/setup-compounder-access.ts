import { ethers } from "hardhat";

async function main() {
  console.log("🔧 Configuration des accès pour le CVTCCompounder...");

  const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  // Adresses des contrats
  const swapAddress = "0xab6C658f36697325c3E7FE5c81d12d73f6A341C6";
  const compounderAddress = "0x6dA2e02a178fF7D790d5BaFcCD2C645d974c0f4e";

  // ABI du contrat Swap
  const swapAbi = [
    "function updateWhitelist(address user, bool status) external",
    "function updateOwnerBot(address bot, bool status) external",
    "function owner() external view returns (address)"
  ];

  console.log("🔍 Vérification du propriétaire du contrat Swap...");
  const swapContract = new ethers.Contract(swapAddress, swapAbi, provider);

  try {
    const owner = await swapContract.owner();
    console.log("👑 Propriétaire du Swap:", owner);

    // Créer un wallet avec la clé privée pour signer les transactions
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.error("❌ PRIVATE_KEY manquante dans .env");
      return;
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    console.log("🔑 Wallet utilisé:", wallet.address);

    if (wallet.address.toLowerCase() !== owner.toLowerCase()) {
      console.error("❌ Le wallet n'est pas le propriétaire du contrat Swap");
      console.log("   Propriétaire attendu:", owner);
      console.log("   Wallet actuel:", wallet.address);
      return;
    }

    const signer = wallet.connect(provider);
    const swapWithSigner = swapContract.connect(signer);

    console.log("\n🔧 Whitelist du CVTCCompounder dans le Swap...");
    const tx1 = await swapWithSigner.updateWhitelist(compounderAddress, true);
    console.log("✅ Transaction whitelist:", tx1.hash);
    await tx1.wait();
    console.log("✅ CVTCCompounder whitelisé avec succès");

    console.log("\n🤖 Ajout du CVTCCompounder comme OwnerBot...");
    const tx2 = await swapWithSigner.updateOwnerBot(compounderAddress, true);
    console.log("✅ Transaction ownerBot:", tx2.hash);
    await tx2.wait();
    console.log("✅ CVTCCompounder ajouté comme OwnerBot avec succès");

    console.log("\n🎉 Configuration terminée !");
    console.log("✅ Le CVTCCompounder peut maintenant interagir avec le Swap");

  } catch (error: any) {
    console.error("❌ Erreur lors de la configuration:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});