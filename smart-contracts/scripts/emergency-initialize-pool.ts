import { ethers } from "hardhat";

async function main() {
  console.log("🚨 INITIALISATION D'URGENCE DU POOL EXISTANT");
  console.log("===========================================");

  // Adresse du swap existant avec les tokens bloqués
  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  console.log(`🔄 Swap Address: ${SWAP_ADDRESS}`);
  console.log(`🪙 Token Address: ${CVTC_TOKEN_ADDRESS}`);

  // Obtenir le signer (deployer)
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // Vérifier le solde BNB
  const bnbBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Solde BNB: ${ethers.formatEther(bnbBalance)} BNB`);

  // Obtenir l'instance du contrat
  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);

  // Vérifier l'état actuel
  const cvtcBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
  const [bnbReserve, cvtcReserve] = await swapContract.getReserves();

  console.log(`\\n📊 ÉTAT ACTUEL:`);
  console.log(`🏦 CVTC dans contrat: ${ethers.formatUnits(cvtcBalance, 2)} CVTC`);
  console.log(`📈 Réserves actuelles - BNB: ${ethers.formatEther(bnbReserve)}, CVTC: ${ethers.formatUnits(cvtcReserve, 2)}`);

  if (cvtcBalance === 0n) {
    throw new Error("Aucun token CVTC dans le contrat swap");
  }

  if (bnbReserve > 0 || cvtcReserve > 0) {
    console.log("⚠️ Le pool a déjà de la liquidité !");
    return;
  }

  // SOLUTION: Utiliser les tokens existants déjà dans le contrat
  console.log("\n🔨 SOLUTION: Utilisation des tokens CVTC existants");

  if (cvtcBalance === 0n) {
    throw new Error("Aucun token CVTC dans le contrat - impossible d'initialiser");
  }

  console.log(`🪙 Tokens CVTC disponibles: ${ethers.formatUnits(cvtcBalance, 2)} CVTC`);

  // Initialiser avec les tokens existants
  console.log("\n🌊 Initialisation du pool avec tokens existants...");

  const BNB_TO_ADD = ethers.parseEther("0.05"); // Petit montant pour commencer
  console.log(`💰 BNB à ajouter: ${ethers.formatEther(BNB_TO_ADD)} BNB`);

  if (bnbBalance < BNB_TO_ADD) {
    throw new Error(`Solde BNB insuffisant: ${ethers.formatEther(bnbBalance)} < ${ethers.formatEther(BNB_TO_ADD)}`);
  }

  // Utiliser la fonction initializeWithExistingTokens (déjà présente dans le contrat)
  console.log("📡 Appel de initializeWithExistingTokens...");
  const initTx = await swapContract.initializeWithExistingTokens(BNB_TO_ADD, {
    value: BNB_TO_ADD
  });
  await initTx.wait();

  console.log("✅ Pool initialisé avec succès !");
  console.log(`📋 Transaction: ${initTx.hash}`);

  // Vérification finale
  const [finalBnbReserve, finalCvtcReserve] = await swapContract.getReserves();
  console.log(`\\n📊 RÉSERVES FINALES:`);
  console.log(`💰 BNB: ${ethers.formatEther(finalBnbReserve)} BNB`);
  console.log(`🪙 CVTC: ${ethers.formatUnits(finalCvtcReserve, 2)} CVTC`);

  if (finalBnbReserve > 0 && finalCvtcReserve > 0) {
    console.log("\\n🎉 SUCCÈS ! POOL OPÉRATIONNEL");
    console.log("===========================");
    console.log("✅ Swaps BNB → CVTC possibles");
    console.log("✅ Onboarding complet fonctionnel");
    console.log("🚀 Prêt pour la production !");
  }
}

// Gestion des erreurs
main().catch((error) => {
  console.error("❌ Erreur lors de l'initialisation d'urgence:", error);
  process.exitCode = 1;
});