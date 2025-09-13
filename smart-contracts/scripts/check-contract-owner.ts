import { ethers } from "hardhat";

async function main() {
  console.log("👑 VÉRIFICATION OWNER CONTRAT");
  console.log("============================");

  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  try {
    const owner = await swapContract.owner();
    const signer = await ethers.getSigners();
    const signerAddress = signer[0].address;

    console.log(`🏢 Contrat: ${SWAP_ADDRESS}`);
    console.log(`👑 Owner: ${owner}`);
    console.log(`👤 Signer: ${signerAddress}`);
    console.log(`🔑 Est owner: ${owner.toLowerCase() === signerAddress.toLowerCase()}`);

    if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
      console.log(`\\n❌ Le signer n'est pas l'owner du contrat`);
      console.log(`Il faut utiliser l'adresse owner pour appeler buyForUser`);
    } else {
      console.log(`\\n✅ Le signer est l'owner du contrat`);
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);