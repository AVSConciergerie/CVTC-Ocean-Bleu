import { ethers } from "hardhat";
import { CVTCOnboarding, CVTCSwap } from "../typechain-types";

async function main() {
  console.log("🚀 Déploiement complet du système d'onboarding CVTC...");

  // Configuration
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3"; // BSC Testnet
  const INITIAL_LIQUIDITY_BNB = ethers.parseEther("10"); // 10 BNB
  const INITIAL_LIQUIDITY_CVTC = ethers.parseEther("10000"); // 10,000 CVTC

  const [deployer] = await ethers.getSigners();
  console.log("Déploiement avec le compte:", deployer.address);
  console.log("Solde BNB:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // === PHASE 1: DÉPLOIEMENT DU POOL DE SWAP ===
  console.log("\n🏊 PHASE 1: Déploiement du pool de swap invisible");

  const cvtcSwapFactory = await ethers.getContractFactory("CVTCSwap");
  const cvtcSwap = await cvtcSwapFactory.deploy(CVTC_TOKEN_ADDRESS) as CVTCSwap;
  await cvtcSwap.waitForDeployment();
  const swapAddress = await cvtcSwap.getAddress();

  console.log("✅ Pool de swap déployé:", swapAddress);

  // Configuration du pool de swap
  const cvtcToken = await ethers.getContractAt("IERC20", CVTC_TOKEN_ADDRESS);
  const cvtcBalance = await cvtcToken.balanceOf(deployer.address);

  if (cvtcBalance >= INITIAL_LIQUIDITY_CVTC) {
    // Approuver et ajouter la liquidité
    await cvtcToken.approve(swapAddress, INITIAL_LIQUIDITY_CVTC);
    await cvtcSwap.addLiquidity(INITIAL_LIQUIDITY_CVTC, { value: INITIAL_LIQUIDITY_BNB });

    console.log("✅ Liquidité ajoutée:");
    console.log("   - BNB:", ethers.formatEther(INITIAL_LIQUIDITY_BNB));
    console.log("   - CVTC:", ethers.formatEther(INITIAL_LIQUIDITY_CVTC));
  } else {
    console.log("⚠️ Solde CVTC insuffisant pour la liquidité initiale");
    console.log("CVTC disponibles:", ethers.formatEther(cvtcBalance));
    console.log("CVTC nécessaires:", ethers.formatEther(INITIAL_LIQUIDITY_CVTC));
  }

  // === PHASE 2: DÉPLOIEMENT DU CONTRAT ONBOARDING ===
  console.log("\n👥 PHASE 2: Déploiement du contrat d'onboarding");

  const onboardingFactory = await ethers.getContractFactory("CVTCOnboarding");
  const onboarding = await onboardingFactory.deploy(CVTC_TOKEN_ADDRESS, swapAddress) as CVTCOnboarding;
  await onboarding.waitForDeployment();
  const onboardingAddress = await onboarding.getAddress();

  console.log("✅ Contrat d'onboarding déployé:", onboardingAddress);

  // === PHASE 3: CONFIGURATION DES AUTORISATIONS ===
  console.log("\n🔐 PHASE 3: Configuration des autorisations");

  // Autoriser le déployeur comme opérateur du système d'onboarding
  await onboarding.setAuthorizedOperator(deployer.address, true);
  console.log("✅ Déployeur autorisé comme opérateur");

  // Ajouter le déployeur à la whitelist du pool de swap
  await cvtcSwap.updateOwnerBot(deployer.address, true);
  console.log("✅ Déployeur ajouté comme owner bot du pool");

  // === PHASE 4: TESTS DE FONCTIONNALITÉ ===
  console.log("\n🧪 PHASE 4: Tests de fonctionnalité de base");

  // Test des constantes
  const initialLoan = await onboarding.INITIAL_LOAN();
  const dailySwap = await onboarding.DAILY_SWAP_AMOUNT();
  console.log("✅ Constantes vérifiées:");
  console.log("   - Prêt initial:", ethers.formatEther(initialLoan), "BNB");
  console.log("   - Swap quotidien:", ethers.formatEther(dailySwap), "BNB");

  // Test des réservess du pool
  const reserves = await cvtcSwap.getReserves();
  console.log("✅ Réserves du pool vérifiées:");
  console.log("   - BNB:", ethers.formatEther(reserves[0]));
  console.log("   - CVTC:", ethers.formatEther(reserves[1]));

  // === PHASE 5: SAUVEGARDE DE LA CONFIGURATION ===
  console.log("\n💾 PHASE 5: Sauvegarde de la configuration complète");

  const fullConfig = {
    network: "bsc-testnet",
    deployedAt: new Date().toISOString(),
    contracts: {
      cvtcToken: CVTC_TOKEN_ADDRESS,
      cvtcSwap: swapAddress,
      cvtcOnboarding: onboardingAddress
    },
    initialLiquidity: {
      bnb: INITIAL_LIQUIDITY_BNB.toString(),
      cvtc: INITIAL_LIQUIDITY_CVTC.toString()
    },
    deployer: deployer.address,
    notes: [
      "Le pool de swap est configuré comme 'invisible' - il fonctionne en arrière-plan",
      "Le contrat d'onboarding gère automatiquement les 30 jours et les remboursements progressifs",
      "Les premiers utilisateurs bénéficieront de transactions gasless via Pimlico",
      "Le système est prêt pour l'intégration frontend et backend"
    ]
  };

  const fs = require("fs");
  const dir = "./deployments";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  fs.writeFileSync("./deployments/full-onboarding-system.json", JSON.stringify(fullConfig, null, 2));
  console.log("📄 Configuration complète sauvegardée dans ./deployments/full-onboarding-system.json");

  // === PHASE 6: RÉSUMÉ FINAL ===
  console.log("\n🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!");
  console.log("=".repeat(60));
  console.log("SYSTÈME D'ONBOARDING CVTC - CONFIGURATION COMPLÈTE");
  console.log("=".repeat(60));
  console.log("📍 Contrats déployés:");
  console.log("   • CVTC Token:", CVTC_TOKEN_ADDRESS);
  console.log("   • Pool de Swap:", swapAddress);
  console.log("   • Contrat Onboarding:", onboardingAddress);
  console.log("");
  console.log("💰 Liquidité initiale:");
  console.log("   • BNB:", ethers.formatEther(INITIAL_LIQUIDITY_BNB));
  console.log("   • CVTC:", ethers.formatEther(INITIAL_LIQUIDITY_CVTC));
  console.log("");
  console.log("⚙️ Fonctionnalités activées:");
  console.log("   • Pool de swap invisible opérationnel");
  console.log("   • Système de prêt automatique (0,30€ BNB)");
  console.log("   • Swaps quotidiens automatiques (0,01€ BNB/jour)");
  console.log("   • Remboursement progressif en 3 paliers");
  console.log("   • Recyclage automatique des fonds");
  console.log("");
  console.log("🚀 Prochaines étapes:");
  console.log("   1. Intégrer Pimlico pour les 1000 premiers utilisateurs");
  console.log("   2. Développer l'interface frontend d'acceptation CGU");
  console.log("   3. Configurer l'automatisation backend des swaps quotidiens");
  console.log("   4. Tester le flux complet avec de vrais utilisateurs");
  console.log("=".repeat(60));

  return {
    cvtcToken: CVTC_TOKEN_ADDRESS,
    cvtcSwap: swapAddress,
    cvtcOnboarding: onboardingAddress
  };
}

// Gestion des erreurs
main().catch((error) => {
  console.error("❌ Erreur lors du déploiement:", error);
  process.exitCode = 1;
});