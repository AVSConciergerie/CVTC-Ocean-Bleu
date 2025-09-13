import { ethers } from "hardhat";

async function main() {
  console.log("💧 AJOUT DE LIQUIDITÉ BNB AU POOL CVTC SWAP");
  console.log("==========================================");

  // Adresses
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

  // Obtenir les instances des contrats
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);
  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  // Vérifier le solde CVTC du deployer
  const deployerCvtcBalance = await cvtcToken.balanceOf(deployer.address);
  console.log(`👤 CVTC du deployer: ${ethers.formatUnits(deployerCvtcBalance, 2)} CVTC`);

  // Si le deployer n'a pas de tokens, en mint
  if (deployerCvtcBalance === 0n) {
    console.log("🔄 Mint de tokens CVTC pour le deployer...");
    const mintAmount = ethers.parseUnits("100000000", 2); // 100 millions de CVTC
    const mintTx = await cvtcToken.mint(deployer.address, mintAmount);
    await mintTx.wait();
    console.log("✅ Tokens CVTC mintés");

    // Re-vérifier le solde
    const newBalance = await cvtcToken.balanceOf(deployer.address);
    console.log(`🪙 Nouveau solde CVTC: ${ethers.formatUnits(newBalance, 2)} CVTC`);
  }

  // Calculer les montants pour la liquidité
  const BNB_TO_ADD = ethers.parseEther("0.1"); // 0.1 BNB
  const CVTC_TO_USE = ethers.parseUnits("50000000", 2); // 50 millions de CVTC

  console.log(`\\n💧 MONTANTS POUR LIQUIDITÉ:`);
  console.log(`💰 BNB à ajouter: ${ethers.formatEther(BNB_TO_ADD)} BNB`);
  console.log(`🪙 CVTC à utiliser: ${ethers.formatUnits(CVTC_TO_USE, 2)} CVTC`);

  // Vérifier que nous avons assez de BNB
  if (bnbBalance < BNB_TO_ADD) {
    throw new Error(`Solde BNB insuffisant: ${ethers.formatEther(bnbBalance)} < ${ethers.formatEther(BNB_TO_ADD)}`);
  }

  // Vérifier que le deployer a assez de CVTC
  const finalCvtcBalance = await cvtcToken.balanceOf(deployer.address);
  if (finalCvtcBalance < CVTC_TO_USE) {
    throw new Error(`CVTC insuffisant pour deployer: ${ethers.formatUnits(finalCvtcBalance, 2)} < ${ethers.formatUnits(CVTC_TO_USE, 2)}`);
  }

  console.log("\\n🔄 Ajout de liquidité BNB au pool...");

  // Ajouter la liquidité BNB (les CVTC sont déjà dans le contrat)
  const addLiquidityTx = await swapContract.addLiquidity(CVTC_TO_USE, {
    value: BNB_TO_ADD
  });
  await addLiquidityTx.wait();

  console.log("✅ Liquidité BNB ajoutée avec succès !");
  console.log(`📋 Transaction: ${addLiquidityTx.hash}`);

  // Vérifier les réserves finales
  const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
  console.log("\\n📊 RÉSERVES FINALES:");
  console.log(`💰 BNB: ${ethers.formatEther(bnbReserve)} BNB`);
  console.log(`🪙 CVTC: ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);

  if (bnbReserve > 0 && cvtcReserve > 0) {
    const ratio = parseFloat(ethers.formatEther(bnbReserve)) / parseFloat(ethers.formatUnits(cvtcReserve, 2));
    console.log(`📈 Ratio BNB/CVTC: ${ratio.toFixed(10)}`);

    console.log("\\n🎉 POOL DE LIQUIDITÉ ACTIF !");
    console.log("===========================");
    console.log("✅ Swaps BNB → CVTC maintenant possibles");
    console.log("✅ Onboarding complet fonctionnel");
    console.log("🚀 Prêt pour la production !");
  } else {
    console.log("\\n❌ LIQUIDITÉ NON AJOUTÉE");
  }
}

// Gestion des erreurs
main().catch((error) => {
  console.error("❌ Erreur lors de l'ajout de liquidité:", error);
  process.exitCode = 1;
});