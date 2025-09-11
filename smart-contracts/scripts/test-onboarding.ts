import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Test du système d'onboarding CVTC...");

  // Adresses des contrats (à remplacer par les vraies adresses après déploiement)
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3"; // BSC Testnet
  const CVTC_SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C"; // Pool déployé
  const ONBOARDING_CONTRACT_ADDRESS = "0xf3af730B6eaF257EC44b244d56F3073Fd6B593c5"; // Onboarding déployé

  const [owner] = await ethers.getSigners();

  // Créer des comptes de test pour les utilisateurs
  const user1 = ethers.Wallet.createRandom().connect(ethers.provider);
  const user2 = ethers.Wallet.createRandom().connect(ethers.provider);

  // Alimenter les comptes de test avec de l'ETH pour les tests
  await owner.sendTransaction({ to: user1.address, value: ethers.parseEther("1") });
  await owner.sendTransaction({ to: user2.address, value: ethers.parseEther("1") });

  console.log("👤 Testeurs:");
  console.log("- Owner:", owner.address);
  console.log("- User1:", user1.address);
  console.log("- User2:", user2.address);

  // Connexion aux contrats déployés
  console.log("\n🔗 Connexion aux contrats déployés...");
  const cvtcSwapContract = await ethers.getContractAt("CVTCSwap", CVTC_SWAP_ADDRESS);
  const onboardingContract = await ethers.getContractAt("CVTCOnboarding", ONBOARDING_CONTRACT_ADDRESS);
  console.log("✅ Connecté au pool de swap:", CVTC_SWAP_ADDRESS);
  console.log("✅ Connecté au contrat d'onboarding:", ONBOARDING_CONTRACT_ADDRESS);

  // Test 1: Vérification des constantes
  console.log("\n📋 Test 1: Vérification des constantes");
  const initialLoan = await onboardingContract.INITIAL_LOAN();
  const dailySwap = await onboardingContract.DAILY_SWAP_AMOUNT();
  console.log("Prêt initial:", ethers.formatEther(initialLoan), "BNB");
  console.log("Swap quotidien:", ethers.formatEther(dailySwap), "BNB");

  // Test 2: Acceptation des CGU par User1
  console.log("\n📝 Test 2: Acceptation des CGU par User1");

  // Alimenter le contrat avec des BNB pour les prêts et swaps
  const fundAmount = ethers.parseEther("2.0"); // 2 BNB pour les tests (prêt + swaps)
  await owner.sendTransaction({
    to: await onboardingContract.getAddress(),
    value: fundAmount
  });
  console.log("✅ Contrat alimenté avec", ethers.formatEther(fundAmount), "BNB");

  console.log("Solde User1 avant:", ethers.formatEther(await ethers.provider.getBalance(user1.address)), "BNB");

  const acceptTx = await onboardingContract.connect(user1).acceptOnboardingTerms();
  await acceptTx.wait();
  console.log("✅ CGU acceptées par User1");

  console.log("Solde User1 après:", ethers.formatEther(await ethers.provider.getBalance(user1.address)), "BNB");

  // Vérifier le statut
  const status1 = await onboardingContract.getUserOnboardingStatus(user1.address);
  console.log("Statut User1 - Actif:", status1.isActive);
  console.log("Statut User1 - Jours restants:", status1.daysRemaining.toString());

  // Test 3: Exécution du premier swap quotidien
  console.log("\n🔄 Test 3: Premier swap quotidien pour User1");

  // Exécuter le swap quotidien (simulé par l'owner comme opérateur autorisé)
  const swapTx = await onboardingContract.executeDailySwap(user1.address);
  await swapTx.wait();
  console.log("✅ Premier swap exécuté pour User1");

  // Vérifier le nouveau statut
  const status2 = await onboardingContract.getUserOnboardingStatus(user1.address);
  console.log("CVTC accumulés:", ethers.formatEther(status2.cvtcAccumulated));
  console.log("Palier actuel:", status2.currentPalier.toString());

  // Test 4: Statistiques globales
  console.log("\n📊 Test 4: Statistiques globales");
  const stats = await onboardingContract.getGlobalStats();
  console.log("Total utilisateurs:", stats._totalUsers.toString());
  console.log("Utilisateurs actifs:", stats._activeUsers.toString());
  console.log("Prêts totaux donnés:", ethers.formatEther(stats._totalLoansGiven), "BNB");

  // Test 5: Simulation de plusieurs jours
  console.log("\n⏰ Test 5: Simulation de 5 jours supplémentaires");
  for (let day = 2; day <= 6; day++) {
    // Avancer le temps de 24h (simulation)
    await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    const swapTx = await onboardingContract.executeDailySwap(user1.address);
    await swapTx.wait();
    console.log(`✅ Jour ${day}: Swap exécuté`);

    const dailyStatus = await onboardingContract.getUserOnboardingStatus(user1.address);
    console.log(`   CVTC accumulés: ${ethers.formatEther(dailyStatus.cvtcAccumulated)}`);
    console.log(`   Palier: ${dailyStatus.currentPalier}`);
  }

  // Test final: Vérification des résultats
  console.log("\n🏁 Test Final: Résultats après 6 jours");
  const finalStatus = await onboardingContract.getUserOnboardingStatus(user1.address);
  console.log("=== RÉSULTATS USER1 ===");
  console.log("Actif:", finalStatus.isActive);
  console.log("Terminé:", finalStatus.completed);
  console.log("Jours restants:", finalStatus.daysRemaining.toString());
  console.log("CVTC accumulés:", ethers.formatEther(finalStatus.cvtcAccumulated));
  console.log("Palier actuel:", finalStatus.currentPalier.toString());
  console.log("Total remboursé:", ethers.formatEther(finalStatus.totalRepaid));

  console.log("\n🎉 Tests terminés avec succès!");
  console.log("Le système d'onboarding fonctionne correctement.");
}

// Gestion des erreurs
main().catch((error) => {
  console.error("❌ Erreur lors des tests:", error);
  process.exitCode = 1;
});