import { ethers } from "hardhat";

async function main() {
  console.log("🔍 TEST DES DIFFÉRENTES VALEURS DE DÉCIMALES");
  console.log("=" .repeat(60));

  const contractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83";
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  console.log(`🏢 Contrat: ${contractAddress}`);
  console.log(`🪙 Token CVTC: ${cvtcTokenAddress}`);
  console.log("");

  try {
    // Obtenir l'instance du token
    const cvtcToken = await ethers.getContractAt("IERC20", cvtcTokenAddress);

    // Récupérer le solde en wei
    const balanceWei = await cvtcToken.balanceOf(contractAddress);
    console.log(`📊 Solde réel: ${balanceWei.toString()} wei`);
    console.log(`📊 Solde réel: 0x${balanceWei.toString(16)} hex`);
    console.log("");

    // Tester différentes valeurs de décimales
    console.log("🔢 TEST AVEC DIFFÉRENTES DÉCIMALES :");
    console.log("-" .repeat(40));

    const targetAmount = 3110.4; // Ce que BSCScan affiche

    for (let decimals = 0; decimals <= 18; decimals++) {
      try {
        const divisor = BigInt(10) ** BigInt(decimals);
        const calculatedAmount = Number(balanceWei) / Number(divisor);

        console.log(`${decimals} décimales: ${calculatedAmount} tokens`);

        if (Math.abs(calculatedAmount - targetAmount) < 0.01) {
          console.log(`🎯 ✅ TROUVÉ ! ${decimals} décimales correspondent à ${targetAmount} CVTC`);
          break;
        }
      } catch (error) {
        console.log(`${decimals} décimales: Erreur de calcul`);
      }
    }

    console.log("");
    console.log("💡 CONCLUSION :");
    console.log("-" .repeat(40));

    // Calcul avec 6 décimales (valeur probable pour ce token)
    const balanceWith6Decimals = Number(balanceWei) / Math.pow(10, 6);
    console.log(`Avec 6 décimales: ${balanceWith6Decimals} CVTC`);

    if (Math.abs(balanceWith6Decimals - targetAmount) < 0.01) {
      console.log("✅ Le token utilise probablement 6 décimales !");
    }

  } catch (error) {
    console.error("❌ Erreur:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });