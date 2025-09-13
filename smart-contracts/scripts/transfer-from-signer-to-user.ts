import { ethers } from "hardhat";

async function main() {
  console.log("🎁 TRANSFERT CVTC SIGNER → UTILISATEUR");
  console.log("======================================");

  const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  try {
    // Vérifier soldes
    const signer = await ethers.getSigners();
    const signerAddress = signer[0].address;
    const signerBalance = await cvtcToken.balanceOf(signerAddress);
    const userBalance = await cvtcToken.balanceOf(USER_ADDRESS);

    console.log(`👤 Signer: ${signerAddress}`);
    console.log(`💰 Solde signer: ${ethers.formatUnits(signerBalance, 2)} CVTC`);
    console.log(`👤 Utilisateur: ${USER_ADDRESS}`);
    console.log(`💰 Solde utilisateur: ${ethers.formatUnits(userBalance, 2)} CVTC`);

    // Calculer le montant à transférer
    const targetAmount = ethers.parseUnits("2500000000", 2);
    const transferAmount = targetAmount - userBalance;

    console.log(`\\n🎯 Objectif utilisateur: ${ethers.formatUnits(targetAmount, 2)} CVTC`);
    console.log(`📤 Montant à transférer: ${ethers.formatUnits(transferAmount, 2)} CVTC`);

    // Vérifier que le signer a assez
    if (signerBalance < transferAmount) {
      console.log(`\\n❌ Solde insuffisant du signer`);
      return;
    }

    // Transférer
    console.log(`\\n🔄 Transfert en cours...`);
    const tx = await cvtcToken.transfer(USER_ADDRESS, transferAmount);
    await tx.wait();

    console.log(`✅ Transfert réussi - Hash: ${tx.hash}`);

    // Vérifier soldes finaux
    const finalUserBalance = await cvtcToken.balanceOf(USER_ADDRESS);
    const finalSignerBalance = await cvtcToken.balanceOf(signerAddress);

    console.log(`\\n💰 Soldes finaux:`);
    console.log(`   Utilisateur: ${ethers.formatUnits(finalUserBalance, 2)} CVTC`);
    console.log(`   Signer: ${ethers.formatUnits(finalSignerBalance, 2)} CVTC`);

    if (finalUserBalance >= targetAmount) {
      console.log(`\\n🎉 OBJECTIF ATTEINT !`);
      console.log(`L'utilisateur a maintenant ${ethers.formatUnits(finalUserBalance, 2)} CVTC`);
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);