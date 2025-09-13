import { ethers } from "hardhat";

async function main() {
  console.log("💧 AJOUT DE LIQUIDITÉ AU POOL CVTC SWAP");
  console.log("======================================");

  // Adresses
  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  // Montants à ajouter (ajustables)
  const BNB_AMOUNT = ethers.parseEther("0.1"); // 0.1 BNB
  const CVTC_AMOUNT = ethers.parseUnits("10000", 2); // 10,000 CVTC

  console.log(`🔄 Swap Address: ${SWAP_ADDRESS}`);
  console.log(`🪙 Token Address: ${CVTC_TOKEN_ADDRESS}`);
  console.log(`💰 BNB Amount: ${ethers.formatEther(BNB_AMOUNT)} BNB`);
  console.log(`🪙 CVTC Amount: ${ethers.formatUnits(CVTC_AMOUNT, 2)} CVTC`);

  // Obtenir le signer (deployer)
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // Vérifier le solde BNB
  const bnbBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Solde BNB: ${ethers.formatEther(bnbBalance)} BNB`);

  if (bnbBalance < BNB_AMOUNT) {
    throw new Error("Solde BNB insuffisant pour ajouter la liquidité");
  }

  // Obtenir l'instance du token CVTC
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);

  // Vérifier le solde CVTC
  const cvtcBalance = await cvtcToken.balanceOf(deployer.address);
  console.log(`🪙 Solde CVTC: ${ethers.formatUnits(cvtcBalance, 2)} CVTC`);

  if (cvtcBalance < CVTC_AMOUNT) {
    console.log("⚠️ Solde CVTC insuffisant. Mint de tokens supplémentaires...");

    // Mint des tokens CVTC si nécessaire
    const mintTx = await cvtcToken.mint(deployer.address, CVTC_AMOUNT);
    await mintTx.wait();
    console.log("✅ Tokens CVTC mintés");
  }

  // Approuver le transfert de CVTC vers le pool
  console.log("🔑 Approbation du transfert CVTC...");
  const approveTx = await cvtcToken.approve(SWAP_ADDRESS, CVTC_AMOUNT);
  await approveTx.wait();
  console.log("✅ Approbation CVTC accordée");

  // Obtenir l'instance du contrat swap
  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  // Ajouter la liquidité
  console.log("🌊 Ajout de liquidité au pool...");
  const addLiquidityTx = await swapContract.addLiquidity(CVTC_AMOUNT, {
    value: BNB_AMOUNT
  });
  await addLiquidityTx.wait();

  console.log("✅ Liquidité ajoutée avec succès !");
  console.log(`📋 Transaction: ${addLiquidityTx.hash}`);

  // Vérifier les réserves après ajout
  const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
  console.log("\n📊 RÉSERVES APRÈS AJOUT:");
  console.log(`💰 BNB Reserve: ${ethers.formatEther(bnbReserve)} BNB`);
  console.log(`🪙 CVTC Reserve: ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);
  console.log(`📈 Ratio: ${parseFloat(ethers.formatEther(bnbReserve)) / parseFloat(ethers.formatUnits(cvtcReserve, 2))} BNB/CVTC`);

  console.log("\n🎉 LIQUIDITÉ AJOUTÉE AVEC SUCCÈS !");
  console.log("=================================");
  console.log("Le pool est maintenant prêt pour les swaps !");
}

// Gestion des erreurs
main().catch((error) => {
  console.error("❌ Erreur lors de l'ajout de liquidité:", error);
  process.exitCode = 1;
});