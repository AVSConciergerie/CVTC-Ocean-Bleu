import { ethers } from "hardhat";

async function main() {
  console.log("🔍 VÉRIFICATION SOLDE CVTC UTILISATEUR");
  console.log("=====================================");

  const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  console.log(`👤 Adresse utilisateur: ${USER_ADDRESS}`);
  console.log(`🪙 Token CVTC: ${CVTC_ADDRESS}`);

  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  try {
    // Vérifier le solde CVTC de l'utilisateur
    const balance = await cvtcToken.balanceOf(USER_ADDRESS);
    const formattedBalance = ethers.formatUnits(balance, 2);

    console.log(`\\n💰 SOLDE RÉEL SUR BLOCKCHAIN:`);
    console.log(`🪙 CVTC détenus: ${formattedBalance} CVTC`);

    // Comparer avec le solde attendu
    const expectedBalance = "2500000000"; // 2.5 milliards selon le backend
    const expectedFormatted = ethers.formatUnits(expectedBalance, 2);

    console.log(`\\n🎯 SOLDE ATTENDU:`);
    console.log(`📊 Selon backend: ${expectedFormatted} CVTC`);

    const difference = parseFloat(expectedFormatted) - parseFloat(formattedBalance);
    console.log(`\\n⚖️ DIFFÉRENCE:`);
    console.log(`📈 Écart: ${difference.toLocaleString()} CVTC`);

    if (difference > 0) {
      console.log(`\\n❌ PROBLÈME DÉTECTÉ:`);
      console.log(`Le solde blockchain ne correspond pas au solde backend`);
      console.log(`Il manque ${difference.toLocaleString()} CVTC sur la blockchain`);

      console.log(`\\n🔧 SOLUTIONS POSSIBLES:`);
      console.log(`1. Vérifier que le premier swap a bien été exécuté`);
      console.log(`2. Vérifier l'adresse du destinataire du swap`);
      console.log(`3. Vérifier si les tokens sont sur une autre adresse`);
      console.log(`4. Rejouer le premier swap si nécessaire`);
    } else if (difference === 0) {
      console.log(`\\n✅ PARFAIT:`);
      console.log(`Le solde blockchain correspond au solde backend`);
    } else {
      console.log(`\\n⚠️ SURPLUS DÉTECTÉ:`);
      console.log(`Le solde blockchain est supérieur au solde backend`);
      console.log(`Surplus: ${Math.abs(difference).toLocaleString()} CVTC`);
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);