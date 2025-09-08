import { ethers } from "hardhat";

async function main() {
  console.log("👑 Configuration de l'utilisateur Premium...");

  const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  // Adresses
  const premiumAddress = "0xA788393d86699cAeABBc78C6B2B5B53c84B39663";
  const userAddress = "0xb60a347C88F1F83Ba53dAA4ef5ab1D83C37CCEa9"; // Notre wallet

  // ABI du contrat Premium
  const premiumAbi = [
    "function addPremiumUser(address user) external",
    "function removePremiumUser(address user) external",
    "function isPremiumUser(address user) external view returns (bool)",
    "function owner() external view returns (address)",
    "function getPremiumUsers() external view returns (address[])",
    "function setPremiumStatus(address user, bool status) external"
  ];

  console.log("🔍 Analyse du contrat Premium...");
  const premiumContract = new ethers.Contract(premiumAddress, premiumAbi, provider);

  try {
    // Vérifier l'owner du contrat
    const owner = await premiumContract.owner();
    console.log("👑 Propriétaire du Premium:", owner);

    // Vérifier si notre wallet est premium
    const isPremium = await premiumContract.isPremiumUser(userAddress);
    console.log("👤 Statut Premium actuel:", isPremium);

    if (isPremium) {
      console.log("✅ L'utilisateur est déjà Premium !");
      return;
    }

    // Configuration de l'utilisateur comme Premium
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.error("❌ PRIVATE_KEY manquante dans .env");
      return;
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    console.log("🔑 Wallet utilisé:", wallet.address);

    if (wallet.address.toLowerCase() !== owner.toLowerCase()) {
      console.error("❌ Le wallet n'est pas propriétaire du contrat Premium");
      console.log("   Propriétaire attendu:", owner);
      console.log("   Wallet actuel:", wallet.address);
      return;
    }

    const premiumWithSigner = premiumContract.connect(wallet);

    console.log("\n👑 Ajout de l'utilisateur comme Premium...");

    try {
      // Essayer différentes fonctions possibles
      let tx;
      try {
        tx = await premiumWithSigner.addPremiumUser(userAddress);
        console.log("✅ Fonction addPremiumUser utilisée");
      } catch (error) {
        try {
          tx = await premiumWithSigner.setPremiumStatus(userAddress, true);
          console.log("✅ Fonction setPremiumStatus utilisée");
        } catch (error2: any) {
          console.error("❌ Aucune fonction d'ajout d'utilisateur trouvée");
          console.log("   Fonctions disponibles à tester manuellement:");
          console.log("   • addPremiumUser(address)");
          console.log("   • setPremiumStatus(address, bool)");
          return;
        }
      }

      console.log("✅ Transaction d'ajout Premium:", tx.hash);
      await tx.wait();
      console.log("✅ Utilisateur ajouté comme Premium avec succès !");

      // Vérification finale
      const isPremiumAfter = await premiumContract.isPremiumUser(userAddress);
      console.log("👤 Statut Premium après ajout:", isPremiumAfter);

      if (isPremiumAfter) {
        console.log("🎉 Configuration terminée ! L'utilisateur peut maintenant utiliser les transferts échelonnés.");
      } else {
        console.log("⚠️  L'ajout n'a pas fonctionné correctement");
      }

    } catch (error: any) {
      console.error("❌ Erreur lors de l'ajout:", error.message);
    }

  } catch (error: any) {
    console.error("❌ Erreur lors de l'analyse:", error.message);
  }

  console.log("\n🎯 Configuration terminée!");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});