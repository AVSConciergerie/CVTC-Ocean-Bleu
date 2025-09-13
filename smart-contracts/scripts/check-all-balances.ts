import { ethers } from "hardhat";

async function main() {
  console.log("💰 VÉRIFICATION TOUS LES SOLDES");
  console.log("===============================");

  const SPECIAL_ADDRESS = "0xFC62525a23197922002F30863Ef7B2d91B6576D0";
  const SIGNER_ADDRESS = "0xb60a347C88F1F83Ba53dAA4ef5ab1D83C37CCEa9";
  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  try {
    const specialBalance = await cvtcToken.balanceOf(SPECIAL_ADDRESS);
    const signerBalance = await cvtcToken.balanceOf(SIGNER_ADDRESS);
    const swapBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);

    console.log(`🎯 Adresse spéciale: ${ethers.formatUnits(specialBalance, 2)} CVTC`);
    console.log(`👤 Signer: ${ethers.formatUnits(signerBalance, 2)} CVTC`);
    console.log(`🏢 Swap contract: ${ethers.formatUnits(swapBalance, 2)} CVTC`);

    const total = specialBalance + signerBalance + swapBalance;
    console.log(`\\n📊 Total: ${ethers.formatUnits(total, 2)} CVTC`);

    // Vérifier les allowances
    console.log(`\\n🔑 Vérification allowances:`);
    const allowanceSpecialToSigner = await cvtcToken.allowance(SPECIAL_ADDRESS, SIGNER_ADDRESS);
    console.log(`   Spéciale -> Signer: ${ethers.formatUnits(allowanceSpecialToSigner, 2)} CVTC`);

    const allowanceSignerToSpecial = await cvtcToken.allowance(SIGNER_ADDRESS, SPECIAL_ADDRESS);
    console.log(`   Signer -> Spéciale: ${ethers.formatUnits(allowanceSignerToSpecial, 2)} CVTC`);

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);