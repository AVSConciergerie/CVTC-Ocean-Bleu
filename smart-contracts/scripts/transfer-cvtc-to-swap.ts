import { ethers } from "hardhat";

async function main() {
  console.log("📤 TRANSFERT CVTC VERS CONTRAT SWAP");
  console.log("===================================");

  const SPECIAL_ADDRESS = "0xFC62525a23197922002F30863Ef7B2d91B6576D0";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";

  // Montant à transférer pour atteindre 2.5 milliards
  const TARGET_CVTC = ethers.parseUnits("2500000000", 2); // 2.5 milliards CVTC

  console.log(`👤 Depuis: ${SPECIAL_ADDRESS}`);
  console.log(`📍 Vers: ${SWAP_ADDRESS}`);
  console.log(`🪙 Token: ${CVTC_ADDRESS}`);
  console.log(`💰 Montant cible: ${ethers.formatUnits(TARGET_CVTC, 2)} CVTC`);

  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  try {
    // Vérifier le solde de l'adresse spéciale
    const specialBalance = await cvtcToken.balanceOf(SPECIAL_ADDRESS);
    console.log(`\\n💰 Solde adresse spéciale: ${ethers.formatUnits(specialBalance, 2)} CVTC`);

    // Vérifier le solde actuel du contrat swap
    const swapBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
    console.log(`💰 Solde contrat swap: ${ethers.formatUnits(swapBalance, 2)} CVTC`);

    // Calculer combien il faut transférer
    const needed = TARGET_CVTC - swapBalance;
    console.log(`\\n📊 CALCUL:`);
    console.log(`Cible: ${ethers.formatUnits(TARGET_CVTC, 2)} CVTC`);
    console.log(`Actuel: ${ethers.formatUnits(swapBalance, 2)} CVTC`);
    console.log(`Besoin: ${ethers.formatUnits(needed, 2)} CVTC`);

    if (needed <= 0) {
      console.log(`\\n✅ DÉJÀ SUFFISANT`);
      console.log(`Le contrat a déjà assez de CVTC`);
      return;
    }

    if (specialBalance < needed) {
      console.log(`\\n❌ SOLDE INSUFFISANT`);
      console.log(`Adresse spéciale n'a pas assez de CVTC`);
      console.log(`Disponible: ${ethers.formatUnits(specialBalance, 2)} CVTC`);
      console.log(`Besoin: ${ethers.formatUnits(needed, 2)} CVTC`);
      return;
    }

    console.log(`\\n✅ CONDITIONS REMPLIES`);
    console.log(`🔄 Transfert en cours...`);

    // Pour simuler le transfert depuis l'adresse spéciale, on utilise le signer actuel
    // En production, il faudrait que l'adresse spéciale fasse elle-même le transfert
    console.log(`\\n⚠️ SIMULATION DU TRANSFERT`);
    console.log(`En production, l'adresse spéciale doit faire ce transfert elle-même`);
    console.log(`Commande pour l'adresse spéciale:`);
    console.log(`cvtcToken.transfer("${SWAP_ADDRESS}", "${needed}")`);

    // Calculer le montant exact à transférer
    const transferAmount = needed;
    console.log(`\\n💸 MONTANT À TRANSFÉRER:`);
    console.log(`${ethers.formatUnits(transferAmount, 2)} CVTC`);
    console.log(`(en wei: ${transferAmount})`);

    console.log(`\\n📋 INSTRUCTIONS POUR L'ADRESSE SPÉCIALE:`);
    console.log(`=======================================`);
    console.log(`1. Aller sur https://testnet.bscscan.com/address/${CVTC_ADDRESS}#writeContract`);
    console.log(`2. Se connecter avec l'adresse spéciale: ${SPECIAL_ADDRESS}`);
    console.log(`3. Appeler la fonction 'transfer':`);
    console.log(`   - to (address): ${SWAP_ADDRESS}`);
    console.log(`   - amount (uint256): ${transferAmount}`);
    console.log(`4. Confirmer la transaction`);

    console.log(`\\n🎯 RÉSULTAT ATTENDU:`);
    console.log(`Après le transfert:`);
    console.log(`- Contrat swap aura: ${ethers.formatUnits(TARGET_CVTC, 2)} CVTC`);
    console.log(`- Ratio sera: 1 BNB = 125,000,000,000,000 CVTC`);

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);