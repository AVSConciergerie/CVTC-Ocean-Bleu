import { ethers } from "hardhat";

async function main() {
  console.log("🎯 INITIALISATION CONTRAT VÉRIFIÉ");
  console.log("================================");

  const SWAP_ADDRESS = "0xff89e2b66Aec76927286e08Ad36158e67ddCfd4d";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);

  // État actuel
  console.log("\\n📊 ÉTAT ACTUEL:");
  const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
  const contractCvtcBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
  const contractBnbBalance = await ethers.provider.getBalance(SWAP_ADDRESS);

  console.log(`💰 BNB dans contrat: ${ethers.formatEther(contractBnbBalance)}`);
  console.log(`🪙 CVTC dans contrat: ${ethers.formatUnits(contractCvtcBalance, 2)}`);
  console.log(`💰 BNB réserve: ${ethers.formatEther(bnbReserve)}`);
  console.log(`🪙 CVTC réserve: ${ethers.formatUnits(cvtcReserve, 2)}`);

  // Objectif: 0.00002 BNB / 2.5 milliards CVTC
  const targetBnb = ethers.parseEther("0.00002");
  const targetCvtc = ethers.parseUnits("2500000000", 2);

  console.log(`\\n🎯 OBJECTIF:`);
  console.log(`💰 BNB cible: ${ethers.formatEther(targetBnb)}`);
  console.log(`🪙 CVTC cible: ${ethers.formatUnits(targetCvtc, 2)}`);

  // Vérifier les quantités disponibles
  const hasEnoughBnb = contractBnbBalance >= targetBnb;
  const hasEnoughCvtc = contractCvtcBalance >= targetCvtc;

  console.log(`\\n✅ VÉRIFICATIONS:`);
  console.log(`BNB suffisant: ${hasEnoughBnb ? '✅' : '❌'}`);
  console.log(`CVTC suffisant: ${hasEnoughCvtc ? '✅' : '❌'}`);

  if (!hasEnoughCvtc) {
    console.log("\\n🪙 AJOUT CVTC MANQUANT...");

    // Essayer de mint les tokens manquants
    const missingCvtc = targetCvtc - contractCvtcBalance;
    console.log(`Manque: ${ethers.formatUnits(missingCvtc, 2)} CVTC`);

    try {
      const mintTx = await cvtcToken.mint(SWAP_ADDRESS, missingCvtc);
      await mintTx.wait();
      console.log("✅ CVTC mintés avec succès!");
    } catch (error) {
      console.log("❌ Mint impossible:", error.message);
      console.log("💡 Il faudra ajouter les CVTC manuellement");
      return;
    }
  }

  // Maintenant initialiser les réserves
  console.log("\\n🚀 INITIALISATION RÉSERVES...");

  // Utiliser emergencySetReserves si disponible
  try {
    console.log("🧪 Test emergencySetReserves...");
    const finalCvtcBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
    const finalBnbBalance = await ethers.provider.getBalance(SWAP_ADDRESS);

    const initTx = await swapContract.emergencySetReserves(finalBnbBalance, finalCvtcBalance);
    await initTx.wait();

    console.log("✅ Réserves initialisées avec succès!");
    console.log(`📋 Hash: ${initTx.hash}`);

  } catch (error) {
    console.log("❌ emergencySetReserves échoue:", error.message);

    // Essayer emergencyInitialize
    try {
      console.log("🧪 Test emergencyInitialize...");
      const initTx = await swapContract.emergencyInitialize();
      await initTx.wait();
      console.log("✅ emergencyInitialize réussi!");
      console.log(`📋 Hash: ${initTx.hash}`);
    } catch (error2) {
      console.log("❌ emergencyInitialize échoue aussi:", error2.message);
      console.log("\\n🔧 SOLUTIONS ALTERNATIVES:");
      console.log("1. 🌐 Utiliser BSCScan pour appeler les fonctions manuellement");
      console.log("2. 📝 Modifier le contrat pour ajouter une fonction d'initialisation");
      console.log("3. 🛠️ Utiliser une fonction existante");
    }
  }

  // Vérification finale
  const [finalBnb, finalCvtc] = await swapContract.getReserves();
  console.log(`\\n🎯 RÉSULTAT FINAL:`);
  console.log(`💰 BNB réserve: ${ethers.formatEther(finalBnb)}`);
  console.log(`🪙 CVTC réserve: ${ethers.formatUnits(finalCvtc, 2)}`);

  if (finalBnb > 0n && finalCvtc > 0n) {
    const ratio = Number(ethers.formatUnits(finalCvtc, 2)) / Number(ethers.formatEther(finalBnb));
    console.log(`📈 Ratio final: 1 BNB = ${ratio.toLocaleString()} CVTC`);

    console.log("\\n🎉 SUCCÈS ! POOL INITIALISÉ !");
    console.log("===========================");
    console.log("✅ Ratio anti-baleine activé");
    console.log("✅ Volatilité maximale");
    console.log("🚀 Onboarding prêt !");

    // Instructions pour le backend
    console.log("\\n⚙️ MISE À JOUR BACKEND REQUISE:");
    console.log(`Adresse: ${SWAP_ADDRESS}`);
    console.log("Modifier backend/.env:");
    console.log(`CVTC_ONBOARDING_CONTRACT_ADDRESS=${SWAP_ADDRESS}`);

  } else {
    console.log("\\n⚠️ INITIALISATION INCOMPLÈTE");
    console.log("🔧 Action manuelle requise via BSCScan");
  }
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});