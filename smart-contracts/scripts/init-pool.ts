import { ethers } from "hardhat";

async function main() {
  console.log("🚀 INITIALISATION POOL ANTI-BALEINE");
  console.log("==================================");

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

  console.log(`\\n🎯 OBJECTIF ANTI-BALEINE:`);
  console.log(`💰 BNB cible: ${ethers.formatEther(targetBnb)}`);
  console.log(`🪙 CVTC cible: ${ethers.formatUnits(targetCvtc, 2)}`);
  console.log(`📈 Ratio souhaité: 1 BNB = 125,000,000,000 CVTC`);

  // Étape 1: Mint les CVTC manquants
  console.log("\\n🪙 ÉTAPE 1: MINT CVTC...");
  const missingCvtc = targetCvtc - contractCvtcBalance;

  if (missingCvtc > 0n) {
    console.log(`Manque: ${ethers.formatUnits(missingCvtc, 2)} CVTC`);

    try {
      const mintTx = await cvtcToken.mint(SWAP_ADDRESS, missingCvtc);
      await mintTx.wait();
      console.log("✅ CVTC mintés avec succès!");
      console.log(`📋 Hash: ${mintTx.hash}`);
    } catch (error) {
      console.log("❌ Mint automatique échoue:", error.message);
      console.log("\\n🔧 SOLUTION MANUELLE REQUISE:");
      console.log("=============================");
      console.log("1. Aller sur BSCScan - Contrat CVTC:");
      console.log(`   https://testnet.bscscan.com/address/${CVTC_TOKEN_ADDRESS}#writeContract`);
      console.log("2. Connecter MetaMask");
      console.log("3. Appeler fonction 'mint':");
      console.log(`   - to: ${SWAP_ADDRESS}`);
      console.log(`   - amount: ${missingCvtc.toString()}`);
      console.log("4. Confirmer la transaction");
      console.log("\\nPuis relancer ce script!");
      return;
    }
  } else {
    console.log("✅ CVTC déjà présents");
  }

  // Étape 2: Vérifier les quantités finales
  console.log("\\n📊 ÉTAPE 2: VÉRIFICATION QUANTITÉS...");
  const finalCvtcBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
  const finalBnbBalance = await ethers.provider.getBalance(SWAP_ADDRESS);

  console.log(`💰 BNB final: ${ethers.formatEther(finalBnbBalance)}`);
  console.log(`🪙 CVTC final: ${ethers.formatUnits(finalCvtcBalance, 2)}`);

  const hasEnoughBnb = finalBnbBalance >= targetBnb;
  const hasEnoughCvtc = finalCvtcBalance >= targetCvtc;

  console.log(`\\n✅ VÉRIFICATIONS:`);
  console.log(`BNB suffisant: ${hasEnoughBnb ? '✅' : '❌'}`);
  console.log(`CVTC suffisant: ${hasEnoughCvtc ? '✅' : '❌'}`);

  if (!hasEnoughBnb || !hasEnoughCvtc) {
    console.log("\\n⚠️ QUANTITÉS INSUFFISANTES");
    if (!hasEnoughBnb) {
      console.log(`❌ Manque ${ethers.formatEther(targetBnb - finalBnbBalance)} BNB`);
    }
    if (!hasEnoughCvtc) {
      console.log(`❌ Manque ${ethers.formatUnits(targetCvtc - finalCvtcBalance, 2)} CVTC`);
    }
    return;
  }

  // Étape 3: Initialiser les réserves
  console.log("\\n🚀 ÉTAPE 3: INITIALISATION RÉSERVES...");

  try {
    console.log("🧪 Tentative emergencySetReserves...");
    const initTx = await swapContract.emergencySetReserves(finalBnbBalance, finalCvtcBalance);
    await initTx.wait();

    console.log("✅ RÉSERVES INITIALISÉES AVEC SUCCÈS!");
    console.log(`📋 Hash: ${initTx.hash}`);

  } catch (error) {
    console.log("❌ emergencySetReserves échoue:", error.message);

    try {
      console.log("🧪 Tentative emergencyInitialize...");
      const initTx = await swapContract.emergencyInitialize();
      await initTx.wait();
      console.log("✅ emergencyInitialize réussi!");
      console.log(`📋 Hash: ${initTx.hash}`);
    } catch (error2) {
      console.log("❌ emergencyInitialize échoue aussi:", error2.message);
      console.log("\\n🔧 SOLUTION MANUELLE VIA BSCSCAN:");
      console.log("=================================");
      console.log("1. Aller sur le contrat swap:");
      console.log(`   https://testnet.bscscan.com/address/${SWAP_ADDRESS}#writeContract`);
      console.log("2. Connecter MetaMask");
      console.log("3. Appeler 'emergencySetReserves':");
      console.log(`   - _bnbReserve: ${finalBnbBalance.toString()}`);
      console.log(`   - _cvtcReserve: ${finalCvtcBalance.toString()}`);
      return;
    }
  }

  // Étape 4: Vérification finale
  console.log("\\n🎯 ÉTAPE 4: VÉRIFICATION FINALE...");
  const [finalBnbReserve, finalCvtcReserve] = await swapContract.getReserves();

  console.log(`💰 BNB réserve: ${ethers.formatEther(finalBnbReserve)}`);
  console.log(`🪙 CVTC réserve: ${ethers.formatUnits(finalCvtcReserve, 2)}`);

  if (finalBnbReserve > 0n && finalCvtcReserve > 0n) {
    const ratio = Number(ethers.formatUnits(finalCvtcReserve, 2)) / Number(ethers.formatEther(finalBnbReserve));
    console.log(`📈 RATIO FINAL: 1 BNB = ${ratio.toLocaleString()} CVTC`);

    console.log("\\n🎉 MISSION ACCOMPLIE !");
    console.log("=====================");
    console.log("✅ Pool anti-baleine initialisé");
    console.log("✅ Ratio extrême activé");
    console.log("✅ Volatilité maximale");
    console.log("🚀 Onboarding prêt !");

    // Instructions pour la suite
    console.log("\\n⚙️ PROCHAINES ÉTAPES:");
    console.log("====================");
    console.log("1. Mettre à jour le backend:");
    console.log(`   CVTC_ONBOARDING_CONTRACT_ADDRESS=${SWAP_ADDRESS}`);
    console.log("2. Tester l'onboarding");
    console.log("3. Lancer la production !");

  } else {
    console.log("\\n⚠️ INITIALISATION INCOMPLÈTE");
    console.log("🔧 Vérifier les transactions sur BSCScan");
  }
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});