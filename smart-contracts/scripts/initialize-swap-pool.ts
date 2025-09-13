import { ethers } from "hardhat";

async function main() {
  console.log("🚀 INITIALISATION DU POOL CVTC SWAP");
  console.log("===================================");

  // Adresses
  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  console.log(`🔄 Swap Address: ${SWAP_ADDRESS}`);
  console.log(`🪙 Token Address: ${CVTC_TOKEN_ADDRESS}`);

  // Obtenir le signer (deployer)
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // Vérifier le solde BNB du deployer
  const bnbBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Solde BNB: ${ethers.formatEther(bnbBalance)} BNB`);

  // Obtenir l'instance du token CVTC
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);

  // Vérifier le solde CVTC du deployer
  const cvtcBalance = await cvtcToken.balanceOf(deployer.address);
  console.log(`🪙 Solde CVTC deployer: ${ethers.formatUnits(cvtcBalance, 2)} CVTC`);

  // Vérifier le solde CVTC du contrat swap
  const swapCvtcBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
  console.log(`🏦 Solde CVTC dans swap: ${ethers.formatUnits(swapCvtcBalance, 2)} CVTC`);

  // Calculer les montants pour la liquidité initiale
  const BNB_AMOUNT = ethers.parseEther("0.05"); // 0.05 BNB
  const CVTC_AMOUNT = ethers.parseUnits("100000", 2); // 100,000 CVTC

  console.log(`\\n💧 MONTANTS POUR LIQUIDITÉ:`);
  console.log(`💰 BNB: ${ethers.formatEther(BNB_AMOUNT)} BNB`);
  console.log(`🪙 CVTC: ${ethers.formatUnits(CVTC_AMOUNT, 2)} CVTC`);

  // Vérifier que nous avons assez de fonds
  if (bnbBalance < BNB_AMOUNT) {
    throw new Error(`Solde BNB insuffisant: ${ethers.formatEther(bnbBalance)} < ${ethers.formatEther(BNB_AMOUNT)}`);
  }

  if (cvtcBalance < CVTC_AMOUNT) {
    console.log("⚠️ Solde CVTC insuffisant. Tentative de récupération depuis le contrat swap...");

    // Essayer de transférer depuis le contrat swap si on est owner
    const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
    try {
      const transferTx = await swapContract.connect(deployer).transfer(SWAP_ADDRESS, CVTC_TOKEN_ADDRESS, CVTC_AMOUNT);
      await transferTx.wait();
      console.log("✅ Tokens transférés depuis le swap contract");
    } catch (error) {
      console.log("❌ Impossible de transférer depuis le swap. Utilisation des tokens disponibles...");
      // Utiliser ce qu'on a
    }
  }

  // Ré-vérifier le solde après transfert
  const finalCvtcBalance = await cvtcToken.balanceOf(deployer.address);
  console.log(`🪙 Solde CVTC final: ${ethers.formatUnits(finalCvtcBalance, 2)} CVTC`);

  if (finalCvtcBalance < CVTC_AMOUNT) {
    console.log(`⚠️ Solde insuffisant. Utilisation de: ${ethers.formatUnits(finalCvtcBalance, 2)} CVTC`);
  }

  // Approuver le transfert de CVTC
  console.log("🔑 Approbation du transfert CVTC...");
  const approveTx = await cvtcToken.approve(SWAP_ADDRESS, finalCvtcBalance);
  await approveTx.wait();
  console.log("✅ Approbation accordée");

  // Obtenir l'instance du contrat swap
  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  // Ajouter la liquidité
  console.log("🌊 Ajout de liquidité...");
  const addLiquidityTx = await swapContract.addLiquidity(finalCvtcBalance, {
    value: BNB_AMOUNT
  });
  await addLiquidityTx.wait();

  console.log("✅ Liquidité ajoutée !");
  console.log(`📋 Transaction: ${addLiquidityTx.hash}`);

  // Vérifier les réserves finales
  const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
  console.log("\\n📊 RÉSERVES FINALES:");
  console.log(`💰 BNB: ${ethers.formatEther(bnbReserve)} BNB`);
  console.log(`🪙 CVTC: ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);

  if (bnbReserve > 0 && cvtcReserve > 0) {
    console.log("🎉 POOL INITIALISÉ AVEC SUCCÈS !");
    console.log("Prêt pour les vrais swaps ! 🚀");
  }
}

// Gestion des erreurs
main().catch((error) => {
  console.error("❌ Erreur lors de l'initialisation:", error);
  process.exitCode = 1;
});