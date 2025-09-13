import { ethers } from "hardhat";

async function main() {
  console.log("🔄 TRANSFERT CVTC DU SWAP VERS DEPLOYER");
  console.log("======================================");

  // Adresses
  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  console.log(`🔄 Swap Address: ${SWAP_ADDRESS}`);
  console.log(`🪙 Token Address: ${CVTC_TOKEN_ADDRESS}`);

  // Obtenir le signer (deployer)
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // Obtenir l'instance du token CVTC
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);

  // Vérifier les soldes
  const swapCvtcBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
  const deployerCvtcBalance = await cvtcToken.balanceOf(deployer.address);

  console.log(`🏦 CVTC dans swap: ${ethers.formatUnits(swapCvtcBalance, 2)} CVTC`);
  console.log(`👤 CVTC du deployer: ${ethers.formatUnits(deployerCvtcBalance, 2)} CVTC`);

  if (swapCvtcBalance === 0n) {
    throw new Error("Aucun token CVTC dans le contrat swap");
  }

  // Calculer le montant à transférer (50 millions pour commencer)
  const TRANSFER_AMOUNT = ethers.parseUnits("50000000", 2);

  console.log(`\\n💸 MONTANT À TRANSFÉRER:`);
  console.log(`🪙 ${ethers.formatUnits(TRANSFER_AMOUNT, 2)} CVTC`);

  // APPROCHE 1: Essayer de transférer directement depuis le swap
  console.log("\\n🔄 Tentative de transfert direct depuis le swap...");

  try {
    // Si le deployer est owner du swap, il peut peut-être transférer
    const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

    // Essayer d'appeler une fonction de transfert si elle existe
    const transferTx = await swapContract.transfer(CVTC_TOKEN_ADDRESS, deployer.address, TRANSFER_AMOUNT);
    await transferTx.wait();

    console.log("✅ Transfert réussi depuis le swap !");
    console.log(`📋 Transaction: ${transferTx.hash}`);

  } catch (error) {
    console.log("❌ Transfert direct impossible:", error.message);

    // APPROCHE 2: Mint de nouveaux tokens
    console.log("\\n🔄 Tentative de mint de tokens...");
    try {
      const mintTx = await cvtcToken.mint(deployer.address, TRANSFER_AMOUNT);
      await mintTx.wait();

      console.log("✅ Mint de tokens réussi !");
      console.log(`📋 Transaction: ${mintTx.hash}`);

    } catch (mintError) {
      console.log("❌ Mint impossible:", mintError.message);

      // APPROCHE 3: Utiliser les tokens existants différemment
      console.log("\\n🔄 Tentative d'utilisation des tokens existants...");

      // Vérifier si nous pouvons au moins ajouter du BNB seul
      const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
      const bnbAmount = ethers.parseEther("0.05");

      console.log("💰 Tentative d'ajout de BNB seul...");
      try {
        const bnbOnlyTx = await swapContract.addLiquidity(0, {
          value: bnbAmount
        });
        await bnbOnlyTx.wait();
        console.log("✅ BNB ajouté au pool");
      } catch (bnbError) {
        console.log("❌ Impossible d'ajouter BNB seul");
        throw new Error("Toutes les approches ont échoué");
      }
    }
  }

  // Vérifier les soldes finaux
  const finalSwapBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
  const finalDeployerBalance = await cvtcToken.balanceOf(deployer.address);

  console.log("\\n📊 SOLDES FINAUX:");
  console.log(`🏦 CVTC dans swap: ${ethers.formatUnits(finalSwapBalance, 2)} CVTC`);
  console.log(`👤 CVTC du deployer: ${ethers.formatUnits(finalDeployerBalance, 2)} CVTC`);

  if (finalDeployerBalance > deployerCvtcBalance) {
    console.log("\\n🎉 SUCCÈS ! Le deployer a maintenant des tokens CVTC");
  }
}

// Gestion des erreurs
main().catch((error) => {
  console.error("❌ Erreur lors du transfert:", error);
  process.exitCode = 1;
});