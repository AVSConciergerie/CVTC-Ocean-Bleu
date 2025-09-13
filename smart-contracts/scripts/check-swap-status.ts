import { ethers } from "hardhat";

async function main() {
  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);

  console.log("🔍 VÉRIFICATION DU STATUT DU CONTRAT SWAP");
  console.log("========================================");

  // Vérifier les états critiques
  const liquidityEnabled = await swapContract.liquidityEnabled();
  const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
  const contractCvtcBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
  const owner = await swapContract.owner();

  console.log(`👑 Owner: ${owner}`);
  console.log(`🔓 Liquidité activée: ${liquidityEnabled}`);
  console.log(`💰 Réserve BNB: ${ethers.formatEther(bnbReserve)}`);
  console.log(`🪙 Réserve CVTC: ${ethers.formatUnits(cvtcReserve, 2)}`);
  console.log(`🏦 CVTC dans contrat: ${ethers.formatUnits(contractCvtcBalance, 2)}`);

  // Vérifier les conditions de initializeWithExistingTokens
  console.log("\n📋 CONDITIONS POUR initializeWithExistingTokens:");
  console.log(`✅ Liquidité activée: ${liquidityEnabled ? "OUI" : "NON"}`);
  console.log(`✅ Réserves vides: ${bnbReserve == 0n && cvtcReserve == 0n ? "OUI" : "NON"}`);
  console.log(`✅ CVTC dans contrat > 0: ${contractCvtcBalance > 0n ? "OUI" : "NON"}`);

  if (!liquidityEnabled) {
    console.log("\n❌ PROBLÈME: Liquidité désactivée - il faut l'activer d'abord");
  }
}

main().catch(console.error);