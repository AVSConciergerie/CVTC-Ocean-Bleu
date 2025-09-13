import { ethers } from "hardhat";

async function main() {
  console.log("🪙 FONDATION DU PAYMASTER AVEC CVTC");
  console.log("==================================");

  const PAYMASTER_ADDRESS = "0x950c9E7ea88beF525E5fFA072E7F092E2B0f7516";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  try {
    // Vérifier solde actuel du paymaster
    const balanceBefore = await cvtcToken.balanceOf(PAYMASTER_ADDRESS);
    console.log(`🏦 Paymaster: ${PAYMASTER_ADDRESS}`);
    console.log(`💰 Solde avant: ${ethers.formatUnits(balanceBefore, 2)} CVTC`);

    // Montant à minter (1000 CVTC pour commencer)
    const mintAmount = ethers.parseUnits("1000", 2);
    console.log(`🪙 Montant à minter: ${ethers.formatUnits(mintAmount, 2)} CVTC`);

    // Mint tokens
    console.log(`\n🔄 Mint en cours...`);
    const tx = await cvtcToken.mint(PAYMASTER_ADDRESS, mintAmount);
    await tx.wait();

    console.log(`✅ Mint réussi - Hash: ${tx.hash}`);

    // Vérifier solde après
    const balanceAfter = await cvtcToken.balanceOf(PAYMASTER_ADDRESS);
    console.log(`\n💰 Solde après: ${ethers.formatUnits(balanceAfter, 2)} CVTC`);

    if (balanceAfter >= mintAmount) {
      console.log(`\n🎉 SUCCÈS ! Le paymaster a maintenant ${ethers.formatUnits(balanceAfter, 2)} CVTC`);
      console.log(`💡 Le paymaster peut maintenant payer les frais de gas en CVTC !`);
    }

  } catch (error) {
    console.log("❌ Erreur lors du mint:", error.message);
  }
}

main().catch(console.error);