import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Test du contrat Premium directement...");

  const provider = new ethers.providers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");

  // Adresses
  const premiumAddress = "0xA788393d86699cAeABBc78C6B2B5B53c84B39663";
  const testRecipient = "0xb60a347C88F1F83Ba53dAA4ef5ab1D83C37CCEa9"; // Notre wallet

  // ABI du contrat Premium
  const premiumAbi = [
    "function initiateStaggeredTransfer(address receiver, uint256 amount) external",
    "function isPremiumUser(address user) external view returns (bool)",
    "function owner() external view returns (address)"
  ];

  console.log("🔍 Test du contrat Premium...");
  const premiumContract = new ethers.Contract(premiumAddress, premiumAbi, provider);

  try {
    // Vérifier l'owner du contrat
    const owner = await premiumContract.owner();
    console.log("👑 Propriétaire du Premium:", owner);

    // Vérifier si notre wallet est un utilisateur premium
    const isPremium = await premiumContract.isPremiumUser(testRecipient);
    console.log("👤 Notre wallet est Premium:", isPremium);

    // Test d'appel direct à initiateStaggeredTransfer
    console.log("\n🧪 Test d'appel direct à initiateStaggeredTransfer...");

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.error("❌ PRIVATE_KEY manquante dans .env");
      return;
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    console.log("🔑 Wallet utilisé:", wallet.address);

    const premiumWithSigner = premiumContract.connect(wallet);

    // Test avec un petit montant
    const testAmount = ethers.utils.parseUnits("0.01", 2); // 0.01 CVTC
    console.log("💰 Montant de test:", ethers.utils.formatUnits(testAmount, 2), "CVTC");

    try {
      const tx = await premiumWithSigner.initiateStaggeredTransfer(testRecipient, testAmount);
      console.log("✅ Transaction directe réussie:", tx.hash);
      await tx.wait();
      console.log("✅ Transaction confirmée !");

    } catch (error: any) {
      console.log("❌ Transaction directe échouée:", error.message);

      // Analyser l'erreur plus en détail
      if (error.message.includes("execution reverted")) {
        console.log("🔍 Erreur d'exécution - vérification des causes possibles:");

        // Vérifier si le contrat a besoin d'approbation
        console.log("   • Le contrat Premium nécessite peut-être une approbation préalable");
        console.log("   • Le montant pourrait être trop élevé");
        console.log("   • Le destinataire pourrait ne pas être valide");
      }
    }

  } catch (error: any) {
    console.error("❌ Erreur lors du test:", error.message);
  }

  console.log("\n🎯 Test terminé!");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});