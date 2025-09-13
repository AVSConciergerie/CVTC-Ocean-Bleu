import { ethers } from "hardhat";

async function main() {
  console.log("🔍 VÉRIFICATION WHITELIST UTILISATEUR");
  console.log("====================================");

  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";
  const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  try {
    const isWhitelisted = await swapContract.whitelisted(USER_ADDRESS);
    const isOwnerBot = await swapContract.ownerBots(USER_ADDRESS);

    console.log(`👤 Utilisateur: ${USER_ADDRESS}`);
    console.log(`✅ Whitelisted: ${isWhitelisted}`);
    console.log(`🤖 Owner Bot: ${isOwnerBot}`);
    console.log(`🔓 Autorisé: ${isWhitelisted || isOwnerBot}`);

    if (!isWhitelisted && !isOwnerBot) {
      console.log(`\\n❌ L'utilisateur n'est pas autorisé pour le swap`);
      console.log(`Il faut l'ajouter à la whitelist ou aux ownerBots`);
    } else {
      console.log(`\\n✅ L'utilisateur est autorisé pour le swap`);
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);