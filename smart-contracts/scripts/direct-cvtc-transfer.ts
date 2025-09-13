import { ethers } from "hardhat";

async function main() {
  console.log("🎁 TRANSFERT DIRECT CVTC À UTILISATEUR");
  console.log("======================================");

  const SPECIAL_ADDRESS = "0xFC62525a23197922002F30863Ef7B2d91B6576D0";
  const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  try {
    // Vérifier soldes
    const specialBalance = await cvtcToken.balanceOf(SPECIAL_ADDRESS);
    const userBalance = await cvtcToken.balanceOf(USER_ADDRESS);

    console.log(`👤 Utilisateur: ${USER_ADDRESS}`);
    console.log(`💰 Solde actuel: ${ethers.formatUnits(userBalance, 2)} CVTC`);
    console.log(`🎯 Objectif: 2,500,000,000 CVTC`);
    console.log(`📊 Manque: ${ethers.formatUnits(ethers.parseUnits("2500000000", 2) - userBalance, 2)} CVTC`);

    // Calculer le montant à transférer
    const targetAmount = ethers.parseUnits("2500000000", 2);
    const transferAmount = targetAmount - userBalance;

    console.log(`\\n💸 Montant à transférer: ${ethers.formatUnits(transferAmount, 2)} CVTC`);

    // Vérifier que l'adresse spéciale a assez
    if (specialBalance < transferAmount) {
      console.log(`\\n❌ Solde insuffisant de l'adresse spéciale`);
      console.log(`Disponible: ${ethers.formatUnits(specialBalance, 2)} CVTC`);
      console.log(`Besoin: ${ethers.formatUnits(transferAmount, 2)} CVTC`);
      return;
    }

    console.log(`\\n✅ Conditions remplies`);
    console.log(`🔄 Exécution du transfert...`);

    // Exécuter le transfert
    const tx = await cvtcToken.transfer(USER_ADDRESS, transferAmount);
    await tx.wait();

    console.log(`✅ Transfert réussi - Hash: ${tx.hash}`);

    // Vérifier le solde final
    const finalUserBalance = await cvtcToken.balanceOf(USER_ADDRESS);
    console.log(`\\n💰 Solde final utilisateur: ${ethers.formatUnits(finalUserBalance, 2)} CVTC`);

    if (finalUserBalance >= targetAmount) {
      console.log(`\\n🎉 OBJECTIF ATTEINT !`);
      console.log(`L'utilisateur a maintenant ses 2.5 milliards CVTC`);
    } else {
      console.log(`\\n⚠️ Transfert partiel`);
    }

  } catch (error) {
    console.log("❌ Erreur lors du transfert:", error.message);
  }
}

main().catch(console.error);