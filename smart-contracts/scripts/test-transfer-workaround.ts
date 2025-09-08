import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Test des transferts échelonnés avec solution temporaire...");

  const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  // Adresses
  const premiumAddress = "0xA788393d86699cAeABBc78C6B2B5B53c84B39663";
  const tokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  // ABI du contrat Premium
  const premiumAbi = [
    "function initiateStaggeredTransfer(address receiver, uint256 amount) external",
    "function isPremiumUser(address user) external view returns (bool)",
    "function owner() external view returns (address)"
  ];

  // ABI du token CVTC
  const tokenAbi = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)"
  ];

  const premiumContract = new ethers.Contract(premiumAddress, premiumAbi, provider);
  const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY manquante dans .env");
    return;
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  console.log("🔑 Wallet:", wallet.address);

  // Vérifier le propriétaire du contrat Premium
  const owner = await premiumContract.owner();
  console.log("👑 Propriétaire du Premium:", owner);

  if (wallet.address.toLowerCase() === owner.toLowerCase()) {
    console.log("✅ Vous êtes le propriétaire ! Création d'une solution temporaire...");

    // Créer un script pour modifier temporairement le contrat
    console.log("\n🛠️  Solution temporaire : Test direct sans vérification Premium");
    console.log("💡 Puisque vous êtes propriétaire, vous pouvez :");
    console.log("   1. Modifier temporairement le contrat pour contourner la vérification");
    console.log("   2. Ou utiliser une fonction d'administration existante");
    console.log("   3. Ou déployer une nouvelle version du contrat");

    // Tester un appel direct au contrat Premium en tant que propriétaire
    console.log("\n🔧 Test d'un appel direct au contrat Premium...");

    const premiumWithSigner = premiumContract.connect(wallet);

    try {
      // Essayer d'appeler une fonction qui pourrait exister
      const testAddress = "0xb60a347C88F1F83Ba53dAA4ef5ab1D83C37CCEa9";
      const testAmount = ethers.utils.parseUnits("0.01", 2); // 0.01 CVTC

      console.log("📋 Test avec:");
      console.log("   • Destinataire:", testAddress);
      console.log("   • Montant:", ethers.utils.formatUnits(testAmount, 2), "CVTC");

      // Vérifier le solde CVTC
      const cvtcBalance = await tokenContract.balanceOf(wallet.address);
      console.log("💰 Solde CVTC:", ethers.utils.formatUnits(cvtcBalance, 2));

      if (cvtcBalance.lt(testAmount)) {
        console.log("❌ Solde CVTC insuffisant pour le test");
        return;
      }

      // Approuver le contrat Premium
      console.log("🔓 Approbation du contrat Premium...");
      const tokenWithSigner = tokenContract.connect(wallet);
      const approveTx = await tokenWithSigner.approve(premiumAddress, testAmount);
      console.log("✅ Approbation:", approveTx.hash);
      await approveTx.wait();

      // Maintenant essayer l'appel au contrat Premium
      console.log("🎯 Tentative d'appel au contrat Premium...");

      // Note: Cette partie échouera probablement car nous ne sommes pas premium
      // Mais cela nous donnera plus d'informations sur l'erreur

      try {
        const transferTx = await premiumWithSigner.initiateStaggeredTransfer(testAddress, testAmount);
        console.log("✅ Transfert réussi:", transferTx.hash);
        await transferTx.wait();
        console.log("🎉 Test réussi !");
      } catch (transferError: any) {
        console.log("❌ Erreur de transfert:", transferError.message);

        if (transferError.message.includes("Not a premium user")) {
          console.log("\n💡 Solution recommandée:");
          console.log("   1. Obtenir 5 BNB sur le faucet BSC Testnet");
          console.log("   2. Exécuter: npx hardhat run scripts/subscribe-premium.ts --network bscTestnet");
          console.log("   3. Ou modifier temporairement le contrat pour les tests");
        }
      }

    } catch (error: any) {
      console.error("❌ Erreur lors du test:", error.message);
    }

  } else {
    console.log("❌ Vous n'êtes pas le propriétaire du contrat Premium");
    console.log("👑 Propriétaire attendu:", owner);
    console.log("🔑 Votre wallet:", wallet.address);
  }

  console.log("\n🎯 Test terminé!");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});