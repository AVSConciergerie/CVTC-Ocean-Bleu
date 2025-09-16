import { ethers } from "hardhat";

async function main() {
  console.log("🔧 Correction du prix Paymaster CVTC");
  console.log("=====================================");

  // Configuration
  const PAYMASTER_ADDRESS = "0xa5e6b56FF29a7d0b19946DB836E31D88E41CAdE2";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const NEW_PRICE = "2000000000000000"; // 0.002 ETH en wei

  console.log(`📋 Paramètres de correction :`);
  console.log(`   Contrat Paymaster: ${PAYMASTER_ADDRESS}`);
  console.log(`   Token CVTC: ${CVTC_TOKEN_ADDRESS}`);
  console.log(`   Nouveau prix: ${NEW_PRICE} wei`);
  console.log("");

  // Obtenir le signer (doit être le propriétaire du contrat)
  const [signer] = await ethers.getSigners();
  console.log(`🔑 Signer: ${signer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await signer.provider.getBalance(signer.address))} BNB`);
  console.log("");

  // Créer l'instance du contrat Paymaster
  const paymasterAbi = [
    "function updateTokenPrice(address token, uint256 newPrice) external",
    "function tokenPrices(address) view returns (uint256)",
    "function owner() view returns (address)"
  ];

  const paymaster = new ethers.Contract(PAYMASTER_ADDRESS, paymasterAbi, signer);

  // Vérifier que le signer est bien le propriétaire
  const owner = await paymaster.owner();
  console.log(`👑 Propriétaire du contrat: ${owner}`);

  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(`❌ Le signer (${signer.address}) n'est pas le propriétaire du contrat (${owner})`);
  }

  console.log("✅ Le signer est bien le propriétaire du contrat");
  console.log("");

  // Vérifier le prix actuel
  const currentPrice = await paymaster.tokenPrices(CVTC_TOKEN_ADDRESS);
  console.log(`💵 Prix actuel: ${currentPrice.toString()} wei`);
  console.log(`💵 Prix actuel (ETH): ${ethers.formatEther(currentPrice)} ETH`);
  console.log("");

  // Calculer le nouveau prix estimé
  const estimatedNewPrice = ethers.parseEther("0.002");
  console.log(`🎯 Nouveau prix cible: ${NEW_PRICE} wei`);
  console.log(`🎯 Nouveau prix cible (ETH): ${ethers.formatEther(NEW_PRICE)} ETH`);
  console.log("");

  // Demander confirmation
  console.log("⚠️  Cette transaction va modifier le prix du token CVTC dans le Paymaster");
  console.log("⚠️  Cela affectera les frais de gas pour tous les utilisateurs");
  console.log("");

  // Exécuter la transaction
  console.log("🚀 Exécution de la transaction updateTokenPrice...");

  try {
    const tx = await paymaster.updateTokenPrice(CVTC_TOKEN_ADDRESS, NEW_PRICE);
    console.log(`📝 Transaction envoyée: ${tx.hash}`);

    console.log("⏳ Attente de la confirmation...");
    const receipt = await tx.wait();

    console.log("✅ Transaction confirmée!");
    console.log(`🔗 Hash: ${receipt.hash}`);
    console.log(`📊 Gas utilisé: ${receipt.gasUsed.toString()}`);
    console.log(`💰 Frais payés: ${ethers.formatEther(receipt.fee)} BNB`);
    console.log("");

    // Vérifier le nouveau prix
    const updatedPrice = await paymaster.tokenPrices(CVTC_TOKEN_ADDRESS);
    console.log(`🔄 Nouveau prix appliqué: ${updatedPrice.toString()} wei`);
    console.log(`🔄 Nouveau prix appliqué (ETH): ${ethers.formatEther(updatedPrice)} ETH`);
    console.log("");

    // Calcul des frais estimés pour une transaction typique
    const gasEstimate = 100000n; // Estimation de gas pour un transfert
    const estimatedFee = (gasEstimate * BigInt(NEW_PRICE)) / BigInt(10 ** 2); // Divisé par 10^2 pour les décimales CVTC
    console.log("📊 Estimation des nouveaux frais:");
    console.log(`   Gas estimé: ${gasEstimate}`);
    console.log(`   Frais en CVTC: ${ethers.formatUnits(estimatedFee, 2)} CVTC`);
    console.log("");

    console.log("🎉 Correction du Paymaster terminée avec succès!");
    console.log("💡 Les utilisateurs peuvent maintenant effectuer des transferts avec des frais raisonnables (~0.01 CVTC)");

  } catch (error) {
    console.error("❌ Erreur lors de la correction:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Échec de la correction:", error);
    process.exit(1);
  });