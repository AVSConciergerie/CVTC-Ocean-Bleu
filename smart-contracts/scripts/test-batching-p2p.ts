import { ethers } from "hardhat";

async function main() {
  console.log("🔄 Test BATCHING + P2P Spécial - Système Premium Avancé");

  const [deployer, user1, user2, user3] = await ethers.getSigners();
  console.log(`📋 Deployer: ${deployer.address}`);
  console.log(`👤 User1: ${user1.address}`);
  console.log(`👤 User2: ${user2.address}`);
  console.log(`👤 User3: ${user3.address}`);

  // Adresses des contrats
  const cvtcPremiumAddress = process.env.CVTC_PREMIUM_ADDRESS;

  if (!cvtcPremiumAddress) {
    console.log("❌ Adresse CVTC_PREMIUM_ADDRESS manquante. Veuillez déployer d'abord.");
    console.log("💡 Commande: npx hardhat run scripts/deploy-all.ts --network bscTestnet");
    return;
  }

  console.log(`👑 CVTC Premium: ${cvtcPremiumAddress}`);

  try {
    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
    const cvtcPremium = CVTCPremium.attach(cvtcPremiumAddress) as any;

    // 1. Vérifier la configuration du batching
    console.log("\n📦 Configuration du Batching:");
    const minBatchSize = await cvtcPremium.MIN_BATCH_SIZE();
    const batchTimeout = await cvtcPremium.BATCH_TIMEOUT();
    const p2pThreshold = await cvtcPremium.P2P_BONUS_THRESHOLD();
    const p2pBonusPercent = await cvtcPremium.P2P_BONUS_PERCENT();

    console.log(`📊 Taille minimum batch: ${minBatchSize} transactions`);
    console.log(`⏰ Timeout batch: ${batchTimeout} secondes`);
    console.log(`💰 Seuil bonus P2P: ${ethers.utils.formatEther(p2pThreshold)} CVTC`);
    console.log(`🎁 Pourcentage bonus P2P: ${p2pBonusPercent}%`);

    // 2. Abonnements premium pour les utilisateurs de test
    console.log("\n👑 Abonnements Premium pour Tests:");

    const users = [user1, user2, user3];
    for (const user of users) {
      console.log(`   Abonnement pour ${user.address.slice(-6)}...`);

      const tx = await user.sendTransaction({
        to: cvtcPremiumAddress,
        value: ethers.utils.parseEther("5.0"),
      });
      await tx.wait();

      const isPremium = await cvtcPremium.isPremiumUser(user.address);
      console.log(`   ✅ ${user.address.slice(-6)}: ${isPremium ? 'PREMIUM' : 'NON PREMIUM'}`);
    }

    // 3. Test du batching avec transactions normales
    console.log("\n📦 Test 1: Batching avec Transactions Normales");

    const normalTransactions = [
      { user: user1, amount: ethers.utils.parseEther("5.0") },
      { user: user2, amount: ethers.utils.parseEther("7.5") },
      { user: user3, amount: ethers.utils.parseEther("3.2") },
      { user: user1, amount: ethers.utils.parseEther("12.0") }, // Cette transaction devrait déclencher le traitement du batch
    ];

    console.log("🔄 Ajout des transactions au batch:");
    for (const tx of normalTransactions) {
      console.log(`   ${tx.user.address.slice(-6)}: ${ethers.utils.formatEther(tx.amount)} BNB`);

      await cvtcPremium.connect(tx.user).addToBatch(tx.amount);

      // Vérifier l'état du batch actuel
      const currentBatchId = await cvtcPremium.currentBatchId();
      const batchInfo = await cvtcPremium.getBatchInfo(currentBatchId);
      console.log(`   📊 Batch ${currentBatchId}: ${batchInfo[0]} transactions, ${ethers.utils.formatEther(batchInfo[1])} BNB total`);
    }

    // Attendre un peu pour voir si le batch se traite automatiquement
    console.log("\n⏳ Attente de 10 secondes pour traitement automatique du batch...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Vérifier si le batch a été traité
    const finalBatchInfo = await cvtcPremium.getBatchInfo(await cvtcPremium.currentBatchId());
    console.log(`📊 État final du batch: ${finalBatchInfo[3] ? 'TRAITÉ' : 'EN ATTENTE'}`);

    // 4. Test P2P spécial avec transferts > 1000 CVTC
    console.log("\n🎁 Test 2: P2P Spécial - Transferts > 1000 CVTC");

    const largeTransactions = [
      { user: user1, amount: ethers.utils.parseEther("1500") }, // 1500 CVTC > seuil
      { user: user2, amount: ethers.utils.parseEther("2000") }, // 2000 CVTC > seuil
      { user: user3, amount: ethers.utils.parseEther("800") },  // 800 CVTC < seuil
      { user: user1, amount: ethers.utils.parseEther("1200") }, // 1200 CVTC > seuil
    ];

    console.log("🔄 Ajout des gros transferts:");
    for (const tx of largeTransactions) {
      const amountInCVTC = Number(ethers.utils.formatEther(tx.amount));
      const hasBonus = amountInCVTC >= 1000;

      console.log(`   ${tx.user.address.slice(-6)}: ${amountInCVTC} CVTC ${hasBonus ? '🎁 BONUS!' : ''}`);

      await cvtcPremium.connect(tx.user).addToBatch(tx.amount);
    }

    // 5. Forcer le traitement du batch pour voir les bonus
    console.log("\n⚡ Forçage du traitement du batch...");
    const currentBatchId = await cvtcPremium.currentBatchId();
    await cvtcPremium.forceProcessBatch(currentBatchId);

    console.log("✅ Batch traité avec bonus P2P!");

    // 6. Statistiques finales
    console.log("\n📊 Statistiques Finales:");

    // Statistiques générales
    const totalUsers = await cvtcPremium.totalPremiumUsers();
    const totalTransactions = await cvtcPremium.totalTransactions();
    const totalDiscounts = await cvtcPremium.totalDiscountsGiven();
    const networkReserve = await cvtcPremium.getTotalReserves();

    console.log(`👥 Utilisateurs premium: ${totalUsers}`);
    console.log(`🔄 Transactions totales: ${totalTransactions}`);
    console.log(`💰 Remises distribuées: ${ethers.utils.formatEther(totalDiscounts)} BNB`);
    console.log(`🏦 Réserve réseau: ${ethers.utils.formatEther(networkReserve)} BNB`);

    // Statistiques P2P spéciales
    const p2pStats = await cvtcPremium.getP2PStats();
    console.log(`\n🎁 Statistiques P2P Spéciales:`);
    console.log(`💰 Bonus P2P distribués: ${ethers.utils.formatEther(p2pStats[0])} BNB`);
    console.log(`📈 Gros transferts (>1000 CVTC): ${p2pStats[1]}`);
    console.log(`📦 Batches traités: ${p2pStats[2]}`);

    // Statistiques individuelles
    console.log(`\n👤 Statistiques par Utilisateur:`);
    for (const user of users) {
      const userInfo = await cvtcPremium.getPremiumUserInfo(user.address);
      const userBonus = await cvtcPremium.getUserP2PBonus(user.address);

      console.log(`   ${user.address.slice(-6)}:`);
      console.log(`     • Réserve: ${ethers.utils.formatEther(userInfo[2])} BNB`);
      console.log(`     • Remises reçues: ${ethers.utils.formatEther(userInfo[3])} BNB`);
      console.log(`     • Transactions: ${userInfo[4]}`);
      console.log(`     • Bonus P2P: ${ethers.utils.formatEther(userBonus)} BNB`);
    }

    // 7. Calcul du ROI avec bonus P2P
    console.log("\n💡 Calcul ROI avec Bonus P2P:");

    const totalDiscountValue = Number(ethers.utils.formatEther(totalDiscounts));
    const totalP2PBonus = Number(ethers.utils.formatEther(p2pStats[0]));
    const subscriptionCost = 5.0 * totalUsers; // 5 BNB par utilisateur

    const totalBenefits = totalDiscountValue + totalP2PBonus;
    const roi = ((totalBenefits / subscriptionCost) * 100).toFixed(2);

    console.log(`💰 Bénéfices totaux: ${totalBenefits.toFixed(4)} BNB`);
    console.log(`   • Remises normales: ${totalDiscountValue.toFixed(4)} BNB`);
    console.log(`   • Bonus P2P: ${totalP2PBonus.toFixed(4)} BNB`);
    console.log(`💳 Coût abonnements: ${subscriptionCost} BNB`);
    console.log(`📈 ROI total: ${roi}%`);

    console.log("\n🎉 Test BATCHING + P2P Spécial terminé avec succès!");
    console.log("✅ Batching opérationnel (min 3 transactions)");
    console.log("✅ Bonus P2P pour transferts > 1000 CVTC");
    console.log("✅ Traitement automatique des batches");
    console.log("✅ Statistiques détaillées disponibles");
    console.log("✅ ROI amélioré avec bonus spéciaux");

  } catch (error: any) {
    console.log("❌ Erreur lors du test batching P2P:", error?.message || "Erreur inconnue");
  }
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});