import { ethers } from "hardhat";

async function main() {
  console.log("🚀 EXÉCUTION AJOUT LIQUIDITÉ MINIATURE");
  console.log("=====================================");

  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // Vérifier le solde BNB
  const bnbBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Solde BNB: ${ethers.formatEther(bnbBalance)} BNB`);

  // Obtenir les contrats
  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);

  // Vérifier les tokens dans le contrat
  const contractCvtcBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
  console.log(`🏦 CVTC dans le contrat: ${ethers.formatUnits(contractCvtcBalance, 2)} CVTC`);

  // Vérifier l'état actuel
  console.log("\\n📊 ÉTAT AVANT:");
  const [bnbReserveBefore, cvtcReserveBefore] = await swapContract.getReserves();
  console.log(`💰 BNB: ${ethers.formatEther(bnbReserveBefore)}`);
  console.log(`🪙 CVTC: ${ethers.formatUnits(cvtcReserveBefore, 2)}`);

  // Montant minuscule à ajouter
  const tinyBnbAmount = ethers.parseEther("0.00002");
  console.log(`\\n🎯 AJOUT DE: ${ethers.formatEther(tinyBnbAmount)} BNB`);

  // Calcul du ratio final
  const finalRatio = Number(ethers.formatUnits(contractCvtcBalance, 2)) / Number(ethers.formatEther(tinyBnbAmount));
  console.log(`📈 RATIO FINAL: 1 BNB = ${finalRatio.toLocaleString()} CVTC`);

  if (bnbBalance < tinyBnbAmount) {
    console.log(`❌ Solde insuffisant: ${ethers.formatEther(bnbBalance)} < ${ethers.formatEther(tinyBnbAmount)}`);
    return;
  }

  console.log("\\n🚨 CONFIRMATION:");
  console.log("=====================================");
  console.log("✅ Utilisation de initializeWithExistingTokens");
  console.log("✅ Ratio anti-baleine: 1:125,000,000,000");
  console.log("✅ Volatilité maximale activée");
  console.log("✅ Contrôle total maintenu");

  // Exécuter l'initialisation
  console.log("\\n⚡ EXÉCUTION...");
  try {
    const initTx = await swapContract.initializeWithExistingTokens(tinyBnbAmount, {
      value: tinyBnbAmount
    });
    await initTx.wait();
    console.log("✅ TRANSACTION RÉUSSIE!");
    console.log(`📋 Hash: ${initTx.hash}`);
  } catch (error) {
    console.log("❌ ÉCHEC DE L'INITIALISATION:", error.message);
    return;
  }

  // Vérification finale
  console.log("\\n📊 ÉTAT APRÈS:");
  const [bnbReserveAfter, cvtcReserveAfter] = await swapContract.getReserves();
  console.log(`💰 BNB: ${ethers.formatEther(bnbReserveAfter)}`);
  console.log(`🪙 CVTC: ${ethers.formatUnits(cvtcReserveAfter, 2)}`);

  if (bnbReserveAfter > 0n && cvtcReserveAfter > 0n) {
    console.log("\\n🎉 SUCCÈS ! POOL ANTI-BALEINE OPÉRATIONNEL");
    console.log("==========================================");
    console.log("✅ Liquidité ajoutée avec succès");
    console.log("✅ Ratio extrêmement déséquilibré");
    console.log("✅ Volatilité maximale activée");
    console.log("✅ Système prêt pour l'onboarding");

    // Calculs pour montrer l'impact
    console.log("\\n📊 IMPACT DES TRANSACTIONS:");
    console.log("===========================");
    console.log(`• 0.001 BNB acheté = ${((0.001 * finalRatio) / 1000000).toFixed(2)} millions CVTC`);
    console.log(`• 1 CVTC vendu = ${(1 / finalRatio).toFixed(10)} BNB`);
    console.log("• Chaque transaction aura un impact énorme sur le prix!");
  } else {
    console.log("\\n⚠️ LIQUIDITÉ NON INITIALISÉE");
  }
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});