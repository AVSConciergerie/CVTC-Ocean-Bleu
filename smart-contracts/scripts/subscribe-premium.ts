import { ethers } from "ethers";

async function main() {
  console.log("💎 Abonnement Premium automatique...");

  const provider = new ethers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");

  // Adresse du contrat Premium
  const premiumAddress = "0xA788393d86699cAeABBc78C6B2B5B53c84B39663";

  // ABI simplifié pour l'abonnement
  const premiumAbi = [
    "function subscribePremium() external payable",
    "function isPremiumUser(address user) external view returns (bool)",
    "function getPremiumUserInfo(address user) external view returns (bool isActive, uint256 subscriptionEnd, uint256 personalReserve, uint256 totalDiscountsReceived, uint256 transactionCount)"
  ];

  const premiumContract = new ethers.Contract(premiumAddress, premiumAbi, provider) as any;

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY manquante dans .env");
    return;
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("🔑 Wallet:", wallet.address);

  // Vérifier si déjà premium
  const isPremium = await premiumContract.isPremiumUser(wallet.address);
  console.log("👤 Statut Premium actuel:", isPremium);

  if (isPremium) {
    console.log("✅ Déjà utilisateur Premium !");
    return;
  }

  console.log("\n💎 Souscription à l'abonnement Premium (5 BNB)...");

  const premiumWithSigner = premiumContract.connect(wallet);

  try {
    // Vérifier le solde BNB
    const balance = await provider.getBalance(wallet.address);
    const balanceBNB = ethers.formatEther(balance);
    console.log("💰 Solde BNB:", balanceBNB);

    if (parseFloat(balanceBNB) < 5.1) {
      console.error("❌ Solde insuffisant (5 BNB requis + frais de gaz)");
      console.log("💡 Obtenez des BNB sur: https://testnet.binance.org/faucet-smart");
      return;
    }

    // S'abonner avec exactement 5 BNB
    const tx = await premiumWithSigner.subscribePremium({
      value: ethers.parseEther("5"),
      gasLimit: 300000
    });

    console.log("✅ Transaction d'abonnement:", tx.hash);
    console.log("⏳ En attente de confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Abonnement confirmé !");
    console.log("📊 Frais de gaz:", ethers.formatEther(receipt.gasUsed * tx.gasPrice), "BNB");

    // Vérification finale
    const isPremiumAfter = await premiumContract.isPremiumUser(wallet.address);
    console.log("👤 Statut Premium après abonnement:", isPremiumAfter);

    if (isPremiumAfter) {
      const userInfo = await premiumContract.getPremiumUserInfo(wallet.address);
      console.log("📋 Informations utilisateur:");
      console.log("   • Actif:", userInfo.isActive);
      console.log("   • Fin d'abonnement:", new Date(userInfo.subscriptionEnd * 1000).toLocaleString());
      console.log("   • Réserve personnelle:", ethers.formatEther(userInfo.personalReserve), "BNB");

      console.log("\n🎉 Abonnement Premium réussi !");
      console.log("✅ Vous pouvez maintenant utiliser les transferts échelonnés !");
    } else {
      console.log("⚠️  L'abonnement n'a pas fonctionné correctement");
    }

  } catch (error: any) {
    console.error("❌ Erreur lors de l'abonnement:", error.message);

    if (error.message.includes("Incorrect subscription price")) {
      console.log("💰 Erreur: Le prix d'abonnement n'est pas correct (doit être exactement 5 BNB)");
    } else if (error.message.includes("Already premium user")) {
      console.log("ℹ️  Vous êtes déjà utilisateur Premium");
    } else if (error.message.includes("insufficient funds")) {
      console.log("💰 Erreur: Fonds insuffisants pour payer l'abonnement (5 BNB requis)");
    }
  }
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});