import { ethers } from "hardhat";

async function main() {
  console.log("👤 VÉRIFICATION SIGNER");
  console.log("======================");

  const signer = await ethers.getSigners();
  const signerAddress = signer[0].address;

  console.log(`👤 Signer address: ${signerAddress}`);

  // Vérifier le solde BNB du signer
  const bnbBalance = await ethers.provider.getBalance(signerAddress);
  console.log(`💰 BNB Balance: ${ethers.formatEther(bnbBalance)} BNB`);

  // Vérifier si c'est l'adresse spéciale
  const SPECIAL_ADDRESS = "0xFC62525a23197922002F30863Ef7B2d91B6576D0";
  console.log(`🎯 Adresse spéciale: ${SPECIAL_ADDRESS}`);
  console.log(`🔗 Est spéciale: ${signerAddress.toLowerCase() === SPECIAL_ADDRESS.toLowerCase()}`);

  if (signerAddress.toLowerCase() !== SPECIAL_ADDRESS.toLowerCase()) {
    console.log(`\\n⚠️ Le signer n'est pas l'adresse spéciale`);
    console.log(`Pour transférer depuis l'adresse spéciale, il faut:`);
    console.log(`1. Changer le PRIVATE_KEY dans .env pour celle de l'adresse spéciale`);
    console.log(`2. Ou utiliser MetaMask avec l'adresse spéciale`);
  }
}

main().catch(console.error);