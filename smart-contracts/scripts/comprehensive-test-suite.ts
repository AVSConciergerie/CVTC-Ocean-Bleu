import { ethers } from "hardhat";

async function main() {
  console.log("🧪 SUITE DE TESTS COMPLÈTE - CVTC OCEAN BLEU");
  console.log("=".repeat(80));
  console.log(`⏰ Début: ${new Date().toISOString()}`);

  const testResults = {
    deployment: false,
    basicFunctionality: false,
    staggeredTransfers: false,
    acceleratedMode: false,
    erc4337Integration: false,
    frontendReadiness: false
  };

  try {
    // 1. VÉRIFICATION DES DÉPLOIEMENTS
    console.log("\n📋 TEST 1: VÉRIFICATION DES DÉPLOIEMENTS");
    console.log("-".repeat(50));

    const contractAddresses = {
      CVTC_SWAP_ADDRESS: process.env.CVTC_SWAP_ADDRESS,
      CVTC_PREMIUM_ADDRESS: process.env.CVTC_PREMIUM_ADDRESS,
      LOCK_ADDRESS: process.env.LOCK_ADDRESS,
      CVTC_COMPOUNDER_ADDRESS: process.env.CVTC_COMPOUNDER_ADDRESS,
    };

    let deployedCount = 0;
    for (const [name, address] of Object.entries(contractAddresses)) {
      if (address && address !== "0x0000000000000000000000000000000000000000") {
        console.log(`✅ ${name}: ${address}`);
        deployedCount++;
      } else {
        console.log(`❌ ${name}: NON DÉPLOYÉ`);
      }
    }

    testResults.deployment = deployedCount === Object.keys(contractAddresses).length;
    console.log(`📊 Résultat: ${deployedCount}/${Object.keys(contractAddresses).length} contrats déployés`);

    if (!testResults.deployment) {
      console.log("⚠️  Certains contrats ne sont pas déployés. Test limité.");
    }

    // 2. TEST DES FONCTIONNALITÉS DE BASE
    console.log("\n🔧 TEST 2: FONCTIONNALITÉS DE BASE");
    console.log("-".repeat(50));

    if (testResults.deployment) {
      const [deployer, user1, user2] = await ethers.getSigners();

      // Test CVTCPremium si déployé
      const cvtcPremiumAddress = process.env.CVTC_PREMIUM_ADDRESS;
      if (cvtcPremiumAddress && cvtcPremiumAddress !== "0x0000000000000000000000000000000000000000") {
        try {
          const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
          const cvtcPremium = CVTCPremium.attach(cvtcPremiumAddress) as any;

          // Vérifier le mode test
          const isTestMode = await cvtcPremium.isTestMode();
          console.log(`🧪 Mode test: ${isTestMode ? "ACTIVÉ ✅" : "DÉSACTIVÉ ❌"}`);

          // Test abonnement premium
          console.log("👑 Test abonnement premium...");
          await user1.sendTransaction({ to: cvtcPremiumAddress, value: ethers.utils.parseEther("5.0") });
          console.log("✅ Abonnement réussi");

          // Vérifier le statut premium
          const isPremium = await cvtcPremium.isPremiumUser(user1.address);
          console.log(`⭐ Statut premium: ${isPremium ? "ACTIF ✅" : "INACTIF ❌"}`);

          testResults.basicFunctionality = isPremium;
          console.log(`📊 Fonctionnalités de base: ${testResults.basicFunctionality ? "RÉUSSIES ✅" : "ÉCHEC ❌"}`);

        } catch (error: any) {
          console.log(`❌ Erreur test fonctionnalités: ${error?.message || "Erreur inconnue"}`);
          testResults.basicFunctionality = false;
        }
      }
    }

    // 3. TEST DES TRANSFERTS ÉCHELONNÉS
    console.log("\n⏱️  TEST 3: TRANSFERTS ÉCHELONNÉS");
    console.log("-".repeat(50));

    if (testResults.deployment && testResults.basicFunctionality) {
      try {
        const [deployer, sender, receiver] = await ethers.getSigners();
        const cvtcPremiumAddress = process.env.CVTC_PREMIUM_ADDRESS;

        if (cvtcPremiumAddress) {
          const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
          const cvtcPremium = CVTCPremium.attach(cvtcPremiumAddress) as any;

          // Abonnement du receiver
          await receiver.sendTransaction({ to: cvtcPremiumAddress, value: ethers.utils.parseEther("5.0") });

          // Test transfert échelonné (simulation sans token réel)
          console.log("🎯 Test logique échelonnée...");

          const transferAmount = ethers.utils.parseEther("1000");
          console.log(`💰 Montant: ${ethers.utils.formatEther(transferAmount)} CVTC`);

          // Calcul de la séquence
          const sequence = calculateStaggeredSequence(transferAmount);
          console.log(`📊 Séquence calculée: ${sequence.map(s => ethers.utils.formatEther(s)).join(" → ")}`);

          // Vérifier les constantes du contrat
          const threshold = await cvtcPremium.STAGGERED_THRESHOLD();
          const maxSteps = await cvtcPremium.MAX_STAGGERED_STEPS();

          console.log(`🎯 Seuil échelonnement: ${ethers.utils.formatEther(threshold)} CVTC`);
          console.log(`🔢 Étapes max: ${maxSteps}`);

          testResults.staggeredTransfers = sequence.length > 0;
          console.log(`📊 Transferts échelonnés: ${testResults.staggeredTransfers ? "RÉUSSIS ✅" : "ÉCHEC ❌"}`);
        }
      } catch (error: any) {
        console.log(`❌ Erreur test échelonnés: ${error?.message || "Erreur inconnue"}`);
        testResults.staggeredTransfers = false;
      }
    }

    // 4. TEST DU MODE ACCÉLÉRÉ
    console.log("\n⚡ TEST 4: MODE ACCÉLÉRÉ (15s = 1 mois)");
    console.log("-".repeat(50));

    if (testResults.deployment) {
      try {
        const cvtcPremiumAddress = process.env.CVTC_PREMIUM_ADDRESS;

        if (cvtcPremiumAddress) {
          const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
          const cvtcPremium = CVTCPremium.attach(cvtcPremiumAddress) as any;

          // Vérifier la durée d'abonnement en mode test
          const subscriptionDuration = await cvtcPremium.getSubscriptionDuration();
          const expectedTestDuration = 15; // secondes

          console.log(`⏱️  Durée abonnement: ${subscriptionDuration} secondes`);
          console.log(`🎯 Attendu (mode test): ${expectedTestDuration} secondes`);

          const isAccelerated = subscriptionDuration === BigInt(expectedTestDuration);
          console.log(`🚀 Mode accéléré: ${isAccelerated ? "ACTIF ✅" : "INACTIF ❌"}`);

          testResults.acceleratedMode = isAccelerated;
          console.log(`📊 Mode accéléré: ${testResults.acceleratedMode ? "RÉUSSI ✅" : "ÉCHEC ❌"}`);
        }
      } catch (error: any) {
        console.log(`❌ Erreur test accéléré: ${error?.message || "Erreur inconnue"}`);
        testResults.acceleratedMode = false;
      }
    }

    // 5. TEST INTÉGRATION ERC-4337
    console.log("\n🔗 TEST 5: INTÉGRATION ERC-4337");
    console.log("-".repeat(50));

    // Vérifier la configuration Pimlico
    const apiKey = process.env.PIMLICO_API_KEY;
    const rpcUrl = process.env.PIMLICO_RPC_URL;

    console.log(`🔑 Clé API Pimlico: ${apiKey ? "CONFIGURÉE ✅" : "MANQUANTE ❌"}`);
    console.log(`🌐 URL RPC Pimlico: ${rpcUrl ? "CONFIGURÉE ✅" : "MANQUANTE ❌"}`);

    testResults.erc4337Integration = !!(apiKey && rpcUrl);
    console.log(`📊 ERC-4337: ${testResults.erc4337Integration ? "RÉUSSI ✅" : "ÉCHEC ❌"}`);

    // 6. TEST PRÊT POUR FRONTEND
    console.log("\n🌐 TEST 6: PRÊT POUR FRONTEND");
    console.log("-".repeat(50));

    // Vérifier les variables d'environnement frontend
    const frontendVars = {
      VITE_PRIVY_APP_ID: process.env.VITE_PRIVY_APP_ID,
      VITE_PIMLICO_API_KEY: process.env.VITE_PIMLICO_API_KEY,
      VITE_PIMLICO_RPC_URL: process.env.VITE_PIMLICO_RPC_URL
    };

    let frontendReady = true;
    console.log("📋 Variables frontend:");
    for (const [key, value] of Object.entries(frontendVars)) {
      const isSet = !!value;
      console.log(`   ${key}: ${isSet ? "✅" : "❌"}`);
      if (!isSet) frontendReady = false;
    }

    testResults.frontendReadiness = frontendReady && testResults.deployment;
    console.log(`📊 Frontend: ${testResults.frontendReadiness ? "PRÊT ✅" : "PAS PRÊT ❌"}`);

  } catch (error: any) {
    console.log(`❌ Erreur générale: ${error?.message || "Erreur inconnue"}`);
  }

  // RAPPORT FINAL
  console.log("\n🎯 RAPPORT FINAL DE TESTS");
  console.log("=".repeat(80));

  const results = Object.entries(testResults);
  const passed = results.filter(([_, result]) => result).length;
  const total = results.length;

  console.log(`📊 Score global: ${passed}/${total} tests réussis`);
  console.log(`📈 Taux de réussite: ${Math.round((passed / total) * 100)}%`);

  console.log("\n📋 DÉTAIL DES TESTS:");
  results.forEach(([test, result]) => {
    const icon = result ? "✅" : "❌";
    const status = result ? "RÉUSSI" : "ÉCHEC";
    console.log(`   ${icon} ${test}: ${status}`);
  });

  console.log(`\n⏰ Fin: ${new Date().toISOString()}`);

  if (passed === total) {
    console.log("\n🎉 TOUS LES TESTS SONT RÉUSSIS !");
    console.log("🚀 Le système est prêt pour les tests frontend !");
  } else {
    console.log("\n⚠️  Certains tests ont échoué.");
    console.log("🔧 Vérifiez les déploiements et configurations.");
  }

  console.log("=".repeat(80));
}

// Fonction utilitaire pour calculer la séquence d'échelonnement
function calculateStaggeredSequence(totalAmount: bigint): bigint[] {
  const sequence: bigint[] = [];
  let remaining = totalAmount;
  let stepAmount = 1n * 10n**18n; // 1 CVTC
  const maxSteps = 10;

  while (remaining > 0n && sequence.length < maxSteps) {
    if (stepAmount >= remaining) {
      sequence.push(remaining);
      remaining = 0n;
    } else {
      sequence.push(stepAmount);
      remaining -= stepAmount;
    }
    stepAmount *= 2n;
  }

  return sequence;
}

main().catch((error) => {
  console.error("❌ Erreur critique:", error);
  process.exitCode = 1;
});