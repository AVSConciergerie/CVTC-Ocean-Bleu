import { ethers } from "hardhat";

async function main() {
  console.log("🔄 RESTAURATION LIQUIDITÉ SWAP");
  console.log("=============================");

  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  try {
    // Vérifier l'état actuel
    const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
    const contractBnbBalance = await ethers.provider.getBalance(SWAP_ADDRESS);
    const contractCvtcBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);

    console.log(`📊 État actuel:`);
    console.log(`   Réserves BNB: ${ethers.formatEther(bnbReserve)} BNB`);
    console.log(`   Réserves CVTC: ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);
    console.log(`   Balance contrat BNB: ${ethers.formatEther(contractBnbBalance)} BNB`);
    console.log(`   Balance contrat CVTC: ${ethers.formatUnits(contractCvtcBalance, 2)} CVTC`);

    // Nouvelle liquidité - quantité que le signer peut fournir
    const signer = await ethers.getSigners();
    const signerAddress = signer[0].address;
    const signerCvtcBalance = await cvtcToken.balanceOf(signerAddress);

    // Utiliser tout le CVTC disponible du signer (1200) et un BNB proportionnel
    const NEW_CVTC_LIQUIDITY = signerCvtcBalance; // 1200 CVTC
    const NEW_BNB_LIQUIDITY = ethers.parseEther("0.00000001"); // Très petit montant BNB

    console.log(`\\n💰 Nouvelle liquidité:`);
    console.log(`   BNB: ${ethers.formatEther(NEW_BNB_LIQUIDITY)} BNB`);
    console.log(`   CVTC: ${ethers.formatUnits(NEW_CVTC_LIQUIDITY, 2)} CVTC`);
    console.log(`   Ratio: 1 BNB = ${Number(ethers.formatUnits(NEW_CVTC_LIQUIDITY, 2)) / Number(ethers.formatEther(NEW_BNB_LIQUIDITY))} CVTC`);

    console.log(`\\n💰 Liquidité à ajouter:`);
    console.log(`   BNB: ${ethers.formatEther(NEW_BNB_LIQUIDITY)} BNB`);
    console.log(`   CVTC: ${ethers.formatUnits(NEW_CVTC_LIQUIDITY, 2)} CVTC`);

    // Vérifier les fonds
    const signerBnbBalance = await ethers.provider.getBalance(signerAddress);
    if (signerBnbBalance < NEW_BNB_LIQUIDITY) {
      console.log(`\\n❌ BNB insuffisant`);
      return;
    }

    // Approuver le contrat swap pour utiliser les CVTC
    console.log(`\\n🔑 Approval des CVTC pour le contrat swap...`);
    const approvalTx = await cvtcToken.approve(SWAP_ADDRESS, NEW_CVTC_LIQUIDITY);
    await approvalTx.wait();
    console.log(`✅ Approval fait`);

    // Ajouter la liquidité
    console.log(`\\n🔄 Ajout liquidité...`);
    const tx = await swapContract.addLiquidity(NEW_CVTC_LIQUIDITY, {
      value: NEW_BNB_LIQUIDITY
    });
    await tx.wait();

    console.log(`✅ Liquidité ajoutée - Hash: ${tx.hash}`);

    // Vérifier l'état final
    const [finalBnbReserve, finalCvtcReserve] = await swapContract.getReserves();
    const finalContractBnb = await ethers.provider.getBalance(SWAP_ADDRESS);
    const finalContractCvtc = await cvtcToken.balanceOf(SWAP_ADDRESS);

    console.log(`\\n📊 État final:`);
    console.log(`   Réserves BNB: ${ethers.formatEther(finalBnbReserve)} BNB`);
    console.log(`   Réserves CVTC: ${ethers.formatUnits(finalCvtcReserve, 2)} CVTC`);
    console.log(`   Balance contrat BNB: ${ethers.formatEther(finalContractBnb)} BNB`);
    console.log(`   Balance contrat CVTC: ${ethers.formatUnits(finalContractCvtc, 2)} CVTC`);

    if (finalBnbReserve > 0 && finalCvtcReserve > 0) {
      const finalRatio = Number(ethers.formatUnits(finalCvtcReserve, 2)) / Number(ethers.formatEther(finalBnbReserve));
      console.log(`\\n📈 Ratio final: 1 BNB = ${finalRatio.toLocaleString()} CVTC`);
      console.log(`\\n🎉 LIQUIDITÉ RESTAURÉE !`);
      console.log(`Le pool est maintenant opérationnel pour les échanges.`);
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);