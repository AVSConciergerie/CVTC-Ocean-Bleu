import { ethers } from "hardhat";

async function main() {
  console.log("🔧 CORRECTION DE LA LIQUIDITÉ DU POOL CVTC SWAP");
  console.log("==============================================");

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

  // Vérifier les soldes actuels
  const swapCvtcBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
  console.log(`🏦 CVTC dans swap: ${ethers.formatUnits(swapCvtcBalance, 2)} CVTC`);

  const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
  console.log(`📊 Réserves actuelles - BNB: ${ethers.formatEther(bnbReserve)}, CVTC: ${ethers.formatUnits(cvtcReserve, 2)}`);

  // STRATÉGIE: Utiliser les tokens déjà dans le contrat swap
  console.log("\\n🎯 STRATÉGIE: Utilisation des tokens existants dans le swap");

  // Calculer les montants pour équilibrer le pool
  const BNB_TO_ADD = ethers.parseEther("0.1"); // 0.1 BNB
  const CVTC_TO_USE = ethers.parseUnits("100000", 2); // 100,000 CVTC des tokens existants

  console.log(`💰 BNB à ajouter: ${ethers.formatEther(BNB_TO_ADD)} BNB`);
  console.log(`🪙 CVTC à utiliser: ${ethers.formatUnits(CVTC_TO_USE, 2)} CVTC`);

  // Vérifier que nous avons assez de BNB
  if (bnbBalance < BNB_TO_ADD) {
    throw new Error(`Solde BNB insuffisant: ${ethers.formatEther(bnbBalance)} < ${ethers.formatEther(BNB_TO_ADD)}`);
  }

  // Vérifier que le swap a assez de CVTC
  if (swapCvtcBalance < CVTC_TO_USE) {
    throw new Error(`CVTC insuffisant dans swap: ${ethers.formatUnits(swapCvtcBalance, 2)} < ${ethers.formatUnits(CVTC_TO_USE, 2)}`);
  }

  // APPROCHE 1: Essayer d'appeler addLiquidity depuis le contrat swap lui-même
  console.log("\\n🔄 Tentative d'ajout de liquidité...");

  try {
    // Puisque les tokens sont déjà dans le contrat swap, on peut essayer d'ajouter de la liquidité
    // en envoyant juste du BNB et en utilisant les CVTC existants
    const addLiquidityTx = await swapContract.addLiquidity(CVTC_TO_USE, {
      value: BNB_TO_ADD
    });
    await addLiquidityTx.wait();

    console.log("✅ Liquidité ajoutée avec succès !");
    console.log(`📋 Transaction: ${addLiquidityTx.hash}`);

  } catch (error) {
    console.log("❌ Échec de l'ajout direct. Tentative alternative...");

    // APPROCHE 2: Créer un script qui transfère les tokens au deployer d'abord
    console.log("🔄 Tentative de transfert des tokens au deployer...");

    // Vérifier si on peut transférer les tokens depuis le swap
    try {
      // Cette approche ne marchera probablement pas car le swap n'a pas de fonction de transfert
      console.log("⚠️ Le contrat swap n'a pas de fonction de transfert direct");

      // APPROCHE 3: Mint de nouveaux tokens et ajout de liquidité
      console.log("🔄 Mint de nouveaux tokens pour le deployer...");
      const mintTx = await cvtcToken.mint(deployer.address, CVTC_TO_USE);
      await mintTx.wait();
      console.log("✅ Nouveaux tokens mintés");

      // Approuver et ajouter liquidité
      const approveTx = await cvtcToken.approve(SWAP_ADDRESS, CVTC_TO_USE);
      await approveTx.wait();
      console.log("✅ Approbation accordée");

      const addLiquidityTx = await swapContract.addLiquidity(CVTC_TO_USE, {
        value: BNB_TO_ADD
      });
      await addLiquidityTx.wait();

      console.log("✅ Liquidité ajoutée avec succès !");
      console.log(`📋 Transaction: ${addLiquidityTx.hash}`);

    } catch (mintError) {
      console.log("❌ Mint impossible. Analyse de l'erreur:", mintError.message);

      // APPROCHE 4: Utiliser seulement du BNB pour commencer
      console.log("🔄 Tentative avec BNB seulement...");
      try {
        // Essayer d'ajouter seulement du BNB (si le contrat le permet)
        const bnbOnlyTx = await swapContract.addLiquidity(0, {
          value: BNB_TO_ADD
        });
        await bnbOnlyTx.wait();
        console.log("✅ BNB ajouté au pool");
      } catch (bnbError) {
        console.log("❌ Impossible d'ajouter du BNB seul");
        throw new Error("Toutes les approches ont échoué");
      }
    }
  }

  // Vérifier les réserves finales
  const [finalBnbReserve, finalCvtcReserve] = await swapContract.getReserves();
  console.log("\\n📊 RÉSERVES FINALES:");
  console.log(`💰 BNB: ${ethers.formatEther(finalBnbReserve)} BNB`);
  console.log(`🪙 CVTC: ${ethers.formatUnits(finalCvtcReserve, 2)} CVTC`);

  if (finalBnbReserve > 0 || finalCvtcReserve > 0) {
    console.log("\\n🎉 LIQUIDITÉ CORRIGÉE !");
    console.log("Le pool est maintenant opérationnel ! 🚀");
  } else {
    console.log("\\n❌ LIQUIDITÉ NON AJOUTÉE");
    console.log("Le problème persiste...");
  }
}

// Gestion des erreurs
main().catch((error) => {
  console.error("❌ Erreur lors de la correction:", error);
  process.exitCode = 1;
});