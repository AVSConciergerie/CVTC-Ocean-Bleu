import { ethers } from "hardhat";

async function main() {
  console.log("💰 VÉRIFICATION SOLDE ADRESSE SPÉCIALE");
  console.log("=====================================");

  const SPECIAL_ADDRESS = "0xFC62525a23197922002F30863Ef7B2d91B6576D0";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  try {
    const balance = await cvtcToken.balanceOf(SPECIAL_ADDRESS);
    console.log(`🎯 Adresse spéciale: ${SPECIAL_ADDRESS}`);
    console.log(`💰 Solde CVTC: ${ethers.formatUnits(balance, 2)} CVTC`);
    console.log(`💰 Solde (wei): ${balance.toString()}`);

    const needed = ethers.parseUnits("2499998800", 2);
    console.log(`\\n📊 Besoin: ${ethers.formatUnits(needed, 2)} CVTC`);

    if (balance >= needed) {
      console.log(`\\n✅ Solde suffisant`);
    } else {
      console.log(`\\n❌ Solde insuffisant`);
      console.log(`Manque: ${ethers.formatUnits(needed - balance, 2)} CVTC`);
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);