import { ethers } from "hardhat";

async function main() {
  console.log("🔍 VÉRIFICATION PRÉCISE DU SOLDE");
  console.log("=" .repeat(50));

  const contractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83";
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  console.log(`🏢 Contrat: ${contractAddress}`);
  console.log(`🪙 Token CVTC: ${cvtcTokenAddress}`);
  console.log("");

  try {
    // Vérifier directement le solde du token
    const cvtcToken = await ethers.getContractAt("IERC20", cvtcTokenAddress);

    console.log("📊 SOLDES DÉTAILLÉS :");
    console.log("-" .repeat(30));

    // Solde en wei (unités minimales)
    const balanceWei = await cvtcToken.balanceOf(contractAddress);
    console.log(`Solde en wei: ${balanceWei.toString()}`);

    // Solde en ethers (tokens)
    const balanceEther = ethers.formatEther(balanceWei);
    console.log(`Solde en CVTC: ${balanceEther}`);

    // Vérification du montant transféré
    const transferredAmount = ethers.parseEther("3110.4");
    console.log(`\n💰 MONTANT TRANSFÉRÉ:`);
    console.log(`3110.4 CVTC = ${transferredAmount.toString()} wei`);

    console.log(`\n🔍 COMPARAISON:`);
    console.log(`Transféré: ${transferredAmount.toString()} wei`);
    console.log(`Dans contrat: ${balanceWei.toString()} wei`);

    if (balanceWei >= transferredAmount) {
      console.log(`✅ LES TOKENS SONT ENCORE LÀ !`);
      console.log(`💰 ${balanceEther} CVTC disponibles pour récupération`);
    } else {
      const difference = transferredAmount - balanceWei;
      console.log(`❌ MANQUE: ${ethers.formatEther(difference)} CVTC`);
      console.log(`Perdus: ${difference.toString()} wei`);
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