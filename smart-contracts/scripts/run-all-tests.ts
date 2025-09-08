import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log("🚀 EXÉCUTION DE TOUS LES TESTS - CVTC OCEAN BLEU");
  console.log("=".repeat(80));
  console.log(`⏰ Début: ${new Date().toISOString()}`);

  const testResults = {
    comprehensive: false,
    deployment: false,
    accelerated: false,
    senderReceiver: false,
    aaInteractions: false
  };

  const network = process.env.NETWORK || 'bscTestnet';

  try {
    // 1. TEST COMPREHENSIF
    console.log("\n🧪 1. TEST COMPREHENSIF");
    console.log("-".repeat(50));

    try {
      console.log("Exécution: comprehensive-test-suite.ts");
      execSync(`npx hardhat run scripts/comprehensive-test-suite.ts --network ${network}`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      testResults.comprehensive = true;
      console.log("✅ Test compréhensif réussi");
    } catch (error) {
      console.log("❌ Test compréhensif échoué");
      testResults.comprehensive = false;
    }

    // 2. VÉRIFICATION DES DÉPLOIEMENTS
    console.log("\n📋 2. VÉRIFICATION DES DÉPLOIEMENTS");
    console.log("-".repeat(50));

    try {
      console.log("Exécution: check-deployment.ts");
      execSync(`npx hardhat run scripts/check-deployment.ts --network ${network}`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      testResults.deployment = true;
      console.log("✅ Vérification déploiements réussie");
    } catch (error) {
      console.log("❌ Vérification déploiements échouée");
      testResults.deployment = false;
    }

    // 3. TEST MODE ACCÉLÉRÉ
    console.log("\n⚡ 3. TEST MODE ACCÉLÉRÉ");
    console.log("-".repeat(50));

    try {
      console.log("Exécution: demo-accelerated.ts");
      execSync(`npx hardhat run scripts/demo-accelerated.ts --network ${network}`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      testResults.accelerated = true;
      console.log("✅ Test accéléré réussi");
    } catch (error) {
      console.log("❌ Test accéléré échoué");
      testResults.accelerated = false;
    }

    // 4. TEST EXPÉDITEUR/DESTINATAIRE
    console.log("\n🎯 4. TEST EXPÉDITEUR/DESTINATAIRE");
    console.log("-".repeat(50));

    try {
      console.log("Exécution: test-sender-pays-receiver-receives.ts");
      execSync(`npx hardhat run scripts/test-sender-pays-receiver-receives.ts --network ${network}`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      testResults.senderReceiver = true;
      console.log("✅ Test expéditeur/destinataire réussi");
    } catch (error) {
      console.log("❌ Test expéditeur/destinataire échoué");
      testResults.senderReceiver = false;
    }

    // 5. TEST INTERACTIONS ERC-4337
    console.log("\n🔗 5. TEST INTERACTIONS ERC-4337");
    console.log("-".repeat(50));

    try {
      console.log("Exécution: test-aa-interactions.ts");
      execSync(`npx hardhat run scripts/test-aa-interactions.ts --network ${network}`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      testResults.aaInteractions = true;
      console.log("✅ Test ERC-4337 réussi");
    } catch (error) {
      console.log("❌ Test ERC-4337 échoué");
      testResults.aaInteractions = false;
    }

    // 6. TESTS SUPPLÉMENTAIRES (si déployés)
    console.log("\n🎮 6. TESTS SUPPLÉMENTAIRES");
    console.log("-".repeat(50));

    const additionalTests = [
      { name: 'Échelonnement P2P', script: 'demo-staggered-p2p.ts' },
      { name: 'Échelonnement mensuel', script: 'test-monthly-staggered.ts' },
      { name: 'Système premium', script: 'test-premium-system.ts' }
    ];

    for (const test of additionalTests) {
      try {
        console.log(`Exécution: ${test.script}`);
        execSync(`npx hardhat run scripts/${test.script} --network ${network}`, {
          stdio: 'inherit',
          cwd: process.cwd()
        });
        console.log(`✅ ${test.name} réussi`);
      } catch (error) {
        console.log(`⚠️  ${test.name} échoué (normal si contrats non déployés)`);
      }
    }

  } catch (error: any) {
    console.log(`❌ Erreur générale: ${error?.message || "Erreur inconnue"}`);
  }

  // RAPPORT FINAL
  console.log("\n🎯 RAPPORT FINAL - TOUS LES TESTS");
  console.log("=".repeat(80));

  const results = Object.entries(testResults);
  const passed = results.filter(([_, result]) => result).length;
  const total = results.length;

  console.log(`📊 Score global: ${passed}/${total} tests principaux réussis`);
  console.log(`📈 Taux de réussite: ${Math.round((passed / total) * 100)}%`);

  console.log("\n📋 RÉSULTATS DÉTAILLÉS:");
  results.forEach(([test, result]) => {
    const icon = result ? "✅" : "❌";
    const status = result ? "RÉUSSI" : "ÉCHEC";
    console.log(`   ${icon} ${test}: ${status}`);
  });

  // GÉNÉRATION DU RAPPORT
  const reportPath = path.join(process.cwd(), 'test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    network: network,
    results: testResults,
    summary: {
      total: total,
      passed: passed,
      failed: total - passed,
      successRate: Math.round((passed / total) * 100)
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd()
    }
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Rapport sauvegardé: ${reportPath}`);

  console.log(`\n⏰ Fin: ${new Date().toISOString()}`);

  // CONCLUSION
  if (passed >= total * 0.8) { // 80% de réussite minimum
    console.log("\n🎉 TESTS GLOBALEMENT RÉUSSIS !");
    console.log("🚀 Le système est prêt pour les tests frontend !");
    console.log("💡 Tu peux maintenant tester l'interface utilisateur.");
  } else {
    console.log("\n⚠️  TESTS PARTIELLEMENT RÉUSSIS");
    console.log("🔧 Certains composants nécessitent attention:");
    console.log("   • Vérifiez les déploiements de contrats");
    console.log("   • Vérifiez les configurations d'environnement");
    console.log("   • Vérifiez les fonds sur les comptes de test");
  }

  console.log("=".repeat(80));
}

main().catch((error) => {
  console.error("❌ Erreur critique:", error);
  process.exitCode = 1;
});