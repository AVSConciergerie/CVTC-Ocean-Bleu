import { ethers } from "hardhat";

async function main() {
  console.log("🔍 VÉRIFICATION STATUT LIQUIDITÉ");
  console.log("===============================");

  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";

  console.log(`📍 Contrat swap: ${SWAP_ADDRESS}`);

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  try {
    // Vérifier si la liquidité est activée
    const liquidityEnabled = await swapContract.liquidityEnabled();
    console.log(`🔄 Liquidité activée: ${liquidityEnabled ? '✅ OUI' : '❌ NON'}`);

    // Vérifier les réserves actuelles
    const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
    console.log(`💰 Réserves BNB: ${ethers.formatEther(bnbReserve)} BNB`);
    console.log(`🪙 Réserves CVTC: ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);

    // Vérifier les balances réelles du contrat
    const contractBalance = await ethers.provider.getBalance(SWAP_ADDRESS);
    console.log(`💰 Balance réelle contrat: ${ethers.formatEther(contractBalance)} BNB`);

    const cvtcToken = await ethers.getContractAt("CVTCLPToken", "0x532FC49071656C16311F2f89E6e41C53243355D3");
    const contractCvtcBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
    console.log(`🪙 Balance CVTC contrat: ${ethers.formatUnits(contractCvtcBalance, 2)} CVTC`);

    if (!liquidityEnabled) {
      console.log("\\n⚠️ LIQUIDITÉ DÉSACTIVÉE - ACTION REQUISE");
      console.log("=====================================");
      console.log("Il faut activer la liquidité avant l'initialisation");
      console.log("Commande: npx hardhat run scripts/enable-liquidity.ts --network bsc");
    } else {
      console.log("\\n✅ LIQUIDITÉ ACTIVÉE - PRÊT POUR INITIALISATION");
      console.log("===============================================");
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);