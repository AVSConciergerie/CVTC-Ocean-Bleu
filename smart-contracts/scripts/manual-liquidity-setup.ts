import { ethers } from "hardhat";

async function main() {
  console.log("🔧 CONFIGURATION MANUELLE LIQUIDITÉ");
  console.log("===================================");

  const NEW_SWAP_ADDRESS = "0x63464DA0d5C5bfC2B7515D4F41D37FD88Bb9E4A9";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  const swapContract = await ethers.getContractAt("CVTCSwapEmergency", NEW_SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);

  // Vérifier l'état actuel
  const deployerCvtcBalance = await cvtcToken.balanceOf(deployer.address);
  console.log(`🪙 CVTC du deployer: ${ethers.formatUnits(deployerCvtcBalance, 2)}`);

  // Solution 1: Transfer depuis le deployer
  if (deployerCvtcBalance >= ethers.parseUnits("1000000", 2)) { // 1 million minimum
    console.log("\\n💡 SOLUTION 1: Transfer depuis le deployer");

    const transferAmount = ethers.parseUnits("1000000", 2); // 1 million CVTC
    console.log(`📊 Transfert: ${ethers.formatUnits(transferAmount, 2)} CVTC vers le swap`);

    // Approuver d'abord
    const approveTx = await cvtcToken.approve(NEW_SWAP_ADDRESS, transferAmount);
    await approveTx.wait();
    console.log("✅ Approbation donnée");

    // Transfer via addLiquidity du contrat (si disponible)
    try {
      const addLiquidityTx = await swapContract.addLiquidity(transferAmount, {
        value: ethers.parseEther("0.01") // Petit montant BNB
      });
      await addLiquidityTx.wait();
      console.log("✅ Liquidité ajoutée via contrat");
    } catch (error) {
      console.log("❌ addLiquidity échoue, transfert direct...");
      // Transfert direct
      const transferTx = await cvtcToken.transfer(NEW_SWAP_ADDRESS, transferAmount);
      await transferTx.wait();
      console.log("✅ Transfert direct réussi");

      // Puis initialiser
      const initTx = await swapContract.emergencyInitialize();
      await initTx.wait();
      console.log("✅ Contrat initialisé");

      // Ajouter BNB
      const addBnbTx = await swapContract.addInitialBnb({
        value: ethers.parseEther("0.01")
      });
      await addBnbTx.wait();
      console.log("✅ BNB ajoutés");
    }
  } else {
    console.log("\\n⚠️ Pas assez de CVTC chez le deployer");
    console.log("💡 SOLUTIONS ALTERNATIVES:");
    console.log("1. Mint manuellement via le contrat token");
    console.log("2. Utiliser des tokens d'un autre wallet");
    console.log("3. Modifier le contrat pour permettre le mint par le owner");
  }

  // Vérification finale
  console.log("\\n📊 ÉTAT FINAL:");
  const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
  console.log(`💰 BNB: ${ethers.formatEther(bnbReserve)}`);
  console.log(`🪙 CVTC: ${ethers.formatUnits(cvtcReserve, 2)}`);

  if (bnbReserve > 0n && cvtcReserve > 0n) {
    console.log("\\n🎉 LIQUIDITÉ AJOUTÉE AVEC SUCCÈS!");
  } else {
    console.log("\\n⚠️ LIQUIDITÉ NON AJOUTÉE");
    console.log("🔧 Action manuelle requise");
  }
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});