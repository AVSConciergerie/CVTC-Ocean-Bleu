import { ethers } from "hardhat";

async function main() {
  console.log("🪙 MINT CVTC POUR UTILISATEUR");
  console.log("============================");

  const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  try {
    // Vérifier solde actuel
    const balanceBefore = await cvtcToken.balanceOf(USER_ADDRESS);
    console.log(`👤 Utilisateur: ${USER_ADDRESS}`);
    console.log(`💰 Solde avant: ${ethers.formatUnits(balanceBefore, 2)} CVTC`);

    // Montant à minter
    const mintAmount = ethers.parseUnits("2500000000", 2) - balanceBefore;
    console.log(`🪙 Montant à minter: ${ethers.formatUnits(mintAmount, 2)} CVTC`);

    // Mint tokens
    console.log(`\\n🔄 Mint en cours...`);
    const tx = await cvtcToken.mint(USER_ADDRESS, mintAmount);
    await tx.wait();

    console.log(`✅ Mint réussi - Hash: ${tx.hash}`);

    // Vérifier solde après
    const balanceAfter = await cvtcToken.balanceOf(USER_ADDRESS);
    console.log(`\\n💰 Solde après: ${ethers.formatUnits(balanceAfter, 2)} CVTC`);

    if (balanceAfter >= ethers.parseUnits("2500000000", 2)) {
      console.log(`\\n🎉 OBJECTIF ATTEINT !`);
    }

  } catch (error) {
    console.log("❌ Erreur lors du mint:", error.message);
  }
}

main().catch(console.error);