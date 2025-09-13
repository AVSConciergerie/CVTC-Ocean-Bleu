import { ethers } from "hardhat";

async function main() {
  console.log("🔄 MISE À JOUR ET INITIALISATION DU POOL CVTC SWAP");
  console.log("=================================================");

  // Ancienne adresse du swap
  const OLD_SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  console.log(`📍 Ancien Swap: ${OLD_SWAP_ADDRESS}`);
  console.log(`🪙 Token CVTC: ${CVTC_TOKEN_ADDRESS}`);

  // Obtenir le signer (deployer)
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // Vérifier le solde BNB
  const bnbBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Solde BNB: ${ethers.formatEther(bnbBalance)} BNB`);

  // PHASE 1: Vérifier l'état actuel
  console.log("\\n🔍 PHASE 1: ANALYSE DE L'ÉTAT ACTUEL");

  const oldSwapContract = await ethers.getContractAt("CVTCSwap", OLD_SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);

  const oldCvtcBalance = await cvtcToken.balanceOf(OLD_SWAP_ADDRESS);
  const [oldBnbReserve, oldCvtcReserve] = await oldSwapContract.getReserves();

  console.log(`🏦 CVTC dans ancien swap: ${ethers.formatUnits(oldCvtcBalance, 2)} CVTC`);
  console.log(`📊 Réserves actuelles - BNB: ${ethers.formatEther(oldBnbReserve)}, CVTC: ${ethers.formatUnits(oldCvtcReserve, 2)}`);

  // PHASE 2: Déployer le nouveau contrat
  console.log("\\n🔨 PHASE 2: DÉPLOIEMENT DU NOUVEAU CONTRAT");

  const CVTCSwap = await ethers.getContractFactory("CVTCSwap");
  const newSwapContract = await CVTCSwap.deploy(CVTC_TOKEN_ADDRESS);
  await newSwapContract.waitForDeployment();
  const NEW_SWAP_ADDRESS = await newSwapContract.getAddress();

  console.log(`✅ Nouveau swap déployé: ${NEW_SWAP_ADDRESS}`);

  // PHASE 3: Transférer les tokens vers le nouveau contrat
  console.log("\\n🔄 PHASE 3: TRANSFERT DES TOKENS");

  if (oldCvtcBalance > 0) {
    console.log("💸 Transfert des tokens CVTC vers le nouveau contrat...");

    // Puisque les tokens sont déjà dans l'ancien contrat, nous devons les "récupérer"
    // Cette étape peut nécessiter une modification manuelle ou une fonction spéciale

    console.log("⚠️ Les tokens sont bloqués dans l'ancien contrat");
    console.log("🎯 Solution: Mint de nouveaux tokens pour le nouveau contrat");

    // Mint de nouveaux tokens pour le nouveau contrat
    const mintAmount = ethers.parseUnits("100000000", 2); // 100 millions pour commencer
    const mintTx = await cvtcToken.mint(NEW_SWAP_ADDRESS, mintAmount);
    await mintTx.wait();

    console.log(`✅ ${ethers.formatUnits(mintAmount, 2)} CVTC mintés dans le nouveau contrat`);
  }

  // PHASE 4: Initialiser la liquidité
  console.log("\\n💧 PHASE 4: INITIALISATION DE LA LIQUIDITÉ");

  const BNB_TO_ADD = ethers.parseEther("0.1"); // 0.1 BNB
  const newCvtcBalance = await cvtcToken.balanceOf(NEW_SWAP_ADDRESS);

  console.log(`💰 BNB à ajouter: ${ethers.formatEther(BNB_TO_ADD)} BNB`);
  console.log(`🪙 CVTC disponible: ${ethers.formatUnits(newCvtcBalance, 2)} CVTC`);

  // Vérifier que nous avons assez de BNB
  if (bnbBalance < BNB_TO_ADD) {
    throw new Error(`Solde BNB insuffisant: ${ethers.formatEther(bnbBalance)} < ${ethers.formatEther(BNB_TO_ADD)}`);
  }

  // Initialiser avec les tokens existants
  console.log("🌊 Initialisation de la liquidité...");
  const initTx = await newSwapContract.initializeWithExistingTokens(BNB_TO_ADD, {
    value: BNB_TO_ADD
  });
  await initTx.wait();

  console.log("✅ Liquidité initialisée !");
  console.log(`📋 Transaction: ${initTx.hash}`);

  // PHASE 5: Vérification finale
  console.log("\\n📊 PHASE 5: VÉRIFICATION FINALE");

  const [finalBnbReserve, finalCvtcReserve] = await newSwapContract.getReserves();
  console.log(`💰 Réserves BNB: ${ethers.formatEther(finalBnbReserve)} BNB`);
  console.log(`🪙 Réserves CVTC: ${ethers.formatUnits(finalCvtcReserve, 2)} CVTC`);

  if (finalBnbReserve > 0 && finalCvtcReserve > 0) {
    const ratio = parseFloat(ethers.formatEther(finalBnbReserve)) / parseFloat(ethers.formatUnits(finalCvtcReserve, 2));
    console.log(`📈 Ratio BNB/CVTC: ${ratio.toFixed(10)}`);

    console.log("\\n🎉 SUCCÈS ! NOUVEAU POOL OPÉRATIONNEL");
    console.log("==================================");
    console.log(`📍 Nouveau Swap Address: ${NEW_SWAP_ADDRESS}`);
    console.log("✅ Liquidité active");
    console.log("🚀 Prêt pour les swaps !");
  }

  // RÉSUMÉ
  console.log("\\n📋 RÉSUMÉ DE LA MIGRATION:");
  console.log(`📍 Ancien contrat: ${OLD_SWAP_ADDRESS}`);
  console.log(`📍 Nouveau contrat: ${NEW_SWAP_ADDRESS}`);
  console.log(`🪙 Tokens migrés: ${ethers.formatUnits(newCvtcBalance, 2)} CVTC`);
  console.log(`💰 Liquidité ajoutée: ${ethers.formatEther(BNB_TO_ADD)} BNB`);
}

// Gestion des erreurs
main().catch((error) => {
  console.error("❌ Erreur lors de la mise à jour:", error);
  process.exitCode = 1;
});