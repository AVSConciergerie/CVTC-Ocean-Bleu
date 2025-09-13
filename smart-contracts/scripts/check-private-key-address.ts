import { ethers } from "hardhat";

async function main() {
  console.log("🔑 VÉRIFICATION ADRESSE DEPUIS PRIVATE KEY");
  console.log("==========================================");

  // La private key du .env
  const PRIVATE_KEY = "0x639a807e339400ed2c795b7b5a9a032b3b730cf08c590e15544de06cc8205f9d";

  // Dériver l'adresse
  const wallet = new ethers.Wallet(PRIVATE_KEY);
  const address = wallet.address;

  console.log(`🔑 Private Key: ${PRIVATE_KEY}`);
  console.log(`👤 Adresse dérivée: ${address}`);

  const SPECIAL_ADDRESS = "0xFC62525a23197922002F30863Ef7B2d91B6576D0";
  console.log(`🎯 Adresse spéciale: ${SPECIAL_ADDRESS}`);
  console.log(`🔗 Correspond: ${address.toLowerCase() === SPECIAL_ADDRESS.toLowerCase()}`);

  if (address.toLowerCase() === SPECIAL_ADDRESS.toLowerCase()) {
    console.log(`\\n✅ La private key correspond à l'adresse spéciale !`);
  } else {
    console.log(`\\n❌ La private key ne correspond pas`);
  }
}

main().catch(console.error);