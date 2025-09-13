import { ethers } from "hardhat";

async function main() {
  console.log("💰 VÉRIFICATION SOLDE CVTC CONTRAT");
  console.log("==================================");

   const SWAP_ADDRESS = "0x0f756152Ec6bdCc83E057E543D949b5F6d8E69cd";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  try {
    const contractBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
    console.log(`🏢 Contrat swap: ${SWAP_ADDRESS}`);
    console.log(`🪙 Token CVTC: ${CVTC_ADDRESS}`);
    console.log(`💰 Solde CVTC: ${ethers.formatUnits(contractBalance, 2)} CVTC`);
    console.log(`💰 Solde (wei): ${contractBalance.toString()}`);

    const totalSupply = await cvtcToken.totalSupply();
    console.log(`\\n📊 Total supply: ${ethers.formatUnits(totalSupply, 2)} CVTC`);

    if (contractBalance >= ethers.parseUnits("2500000000", 2)) {
      console.log(`\\n✅ Solde suffisant pour les swaps`);
    } else {
      console.log(`\\n❌ Solde insuffisant`);
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);