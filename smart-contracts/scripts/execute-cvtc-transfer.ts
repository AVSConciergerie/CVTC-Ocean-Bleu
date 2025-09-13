import { ethers } from "hardhat";

async function main() {
  console.log("🔄 EXÉCUTION TRANSFERT CVTC");
  console.log("===========================");

  const SPECIAL_ADDRESS = "0xFC62525a23197922002F30863Ef7B2d91B6576D0";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";

  // Montant à transférer
  const TRANSFER_AMOUNT = ethers.parseUnits("2453126512.85", 2);

  console.log(`📤 Transfert: ${ethers.formatUnits(TRANSFER_AMOUNT, 2)} CVTC`);
  console.log(`👤 De: ${SPECIAL_ADDRESS}`);
  console.log(`📍 Vers: ${SWAP_ADDRESS}`);

  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  try {
    // Vérifier le solde avant
    const balanceBefore = await cvtcToken.balanceOf(SWAP_ADDRESS);
    console.log(`\\n💰 Solde contrat avant: ${ethers.formatUnits(balanceBefore, 2)} CVTC`);

    // Exécuter le transfert
    console.log(`\\n🔄 Exécution du transfert...`);
    const tx = await cvtcToken.transfer(SWAP_ADDRESS, TRANSFER_AMOUNT);
    await tx.wait();

    console.log(`✅ Transfert réussi - Hash: ${tx.hash}`);

    // Vérifier le solde après
    const balanceAfter = await cvtcToken.balanceOf(SWAP_ADDRESS);
    console.log(`💰 Solde contrat après: ${ethers.formatUnits(balanceAfter, 2)} CVTC`);

    const difference = balanceAfter - balanceBefore;
    console.log(`📊 Différence: +${ethers.formatUnits(difference, 2)} CVTC`);

  } catch (error) {
    console.log("❌ Erreur lors du transfert:", error.message);
  }
}

main().catch(console.error);