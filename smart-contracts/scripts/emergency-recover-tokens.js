const { ethers } = require("ethers");

async function main() {
  console.log("🚨 RÉCUPÉRATION D'URGENCE DES TOKENS CVTC");
  console.log("==========================================");

  const contractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83";
  const userAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";
  const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY; // Mets ta clé privée de l'adresse propriétaire ici

  if (!ownerPrivateKey) {
    console.error("❌ OWNER_PRIVATE_KEY non défini. Définit ta clé privée dans les variables d'environnement.");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
  const wallet = new ethers.Wallet(ownerPrivateKey, provider);

  console.log(`👤 Utilisateur: ${userAddress}`);
  console.log(`🏠 Contrat: ${contractAddress}`);
  console.log(`🔑 Signer: ${wallet.address}`);

  // ABI pour la fonction d'urgence
  const emergencyABI = [
    "function emergencyCVTCReturn(address user, uint256 amount) external"
  ];

  const contract = new ethers.Contract(contractAddress, emergencyABI, wallet);

  try {
    // Montant à récupérer: 3110.4 CVTC = 311040 (décimales 2)
    const amount = 311040;

    console.log(`💰 Montant à récupérer: ${amount} unités (3110.4 CVTC)`);

    // Appeler la fonction
    console.log("📤 Appel de emergencyCVTCReturn...");
    const tx = await contract.emergencyCVTCReturn(userAddress, amount);
    console.log(`✅ Transaction envoyée: ${tx.hash}`);

    // Attendre la confirmation
    console.log("⏳ Attente de confirmation...");
    const receipt = await tx.wait();
    console.log(`🎉 Transaction confirmée! Block: ${receipt.blockNumber}`);

    console.log("\n✅ RÉCUPÉRATION RÉUSSIE!");
    console.log(`Les ${amount} unités CVTC ont été transférées à ${userAddress}`);

  } catch (error) {
    console.error("❌ Erreur lors de la récupération:", error.message);
    if (error.message.includes("execution reverted")) {
      console.log("💡 Vérifie que tu es bien le propriétaire du contrat.");
    }
  }
}

main().catch((error) => {
  console.error("❌ Erreur générale:", error);
  process.exitCode = 1;
});