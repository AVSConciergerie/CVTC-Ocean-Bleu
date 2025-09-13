import { ethers } from "hardhat";

async function main() {
  console.log("👑 VÉRIFICATION OWNER TOKEN CVTC");
  console.log("===============================");

  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const SIGNER_ADDRESS = "0xb60a347C88F1F83Ba53dAA4ef5ab1D83C37CCEa9";

  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  try {
    const owner = await cvtcToken.owner();
    console.log(`🪙 Token CVTC: ${CVTC_ADDRESS}`);
    console.log(`👑 Owner: ${owner}`);
    console.log(`👤 Signer: ${SIGNER_ADDRESS}`);
    console.log(`🔑 Est owner: ${owner.toLowerCase() === SIGNER_ADDRESS.toLowerCase()}`);

    if (owner.toLowerCase() === SIGNER_ADDRESS.toLowerCase()) {
      console.log(`\\n✅ Le signer peut minter des tokens`);
    } else {
      console.log(`\\n❌ Le signer n'est pas l'owner`);
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);