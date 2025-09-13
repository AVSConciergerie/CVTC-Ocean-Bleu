import { ethers } from "hardhat";

async function main() {
  console.log("🔍 VÉRIFICATION ADRESSE SPÉCIALE");
  console.log("===============================");

  const SPECIAL_ADDRESS = "0xFC62525a23197922002F30863Ef7B2d91B6576D0";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const SWAP_ADDRESS = "0xff89e2b66Aec76927286e08Ad36158e67ddCfd4d";

  console.log(`👤 Adresse spéciale: ${SPECIAL_ADDRESS}`);
  console.log(`🪙 Token CVTC: ${CVTC_ADDRESS}`);
  console.log(`📍 Contrat swap: ${SWAP_ADDRESS}`);

  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  // Vérifier le solde de l'adresse spéciale
  console.log("\\n💰 SOLDE ADRESSE SPÉCIALE:");
  try {
    const balance = await cvtcToken.balanceOf(SPECIAL_ADDRESS);
    console.log(`🪙 CVTC détenus: ${ethers.formatUnits(balance, 2)}`);

    const needed = ethers.parseUnits("2500000000", 2);
    const hasEnough = balance >= needed;

    console.log(`🎯 CVTC nécessaires: ${ethers.formatUnits(needed, 2)}`);
    console.log(`✅ Suffisant: ${hasEnough ? 'OUI' : 'NON'}`);

    if (hasEnough) {
      console.log("\\n🎉 PARFAIT ! L'ADRESSE A ASSEZ DE TOKENS");
      console.log("=====================================");
      console.log("✅ Prêt pour transfert direct");
      console.log("✅ Pas besoin de mint");
      console.log("✅ Initialisation possible");
    } else {
      const missing = needed - balance;
      console.log(`\\n❌ MANQUE: ${ethers.formatUnits(missing, 2)} CVTC`);
    }

  } catch (error) {
    console.log("❌ Erreur vérification solde:", error.message);
  }

  // Vérifier les permissions de transfert
  console.log("\\n🔐 VÉRIFICATION PERMISSIONS:");
  try {
    // Vérifier si l'adresse peut transférer
    const totalSupply = await cvtcToken.totalSupply();
    console.log(`📊 Total supply: ${ethers.formatUnits(totalSupply, 2)} CVTC`);

    // Vérifier si c'est un contrat ou un wallet
    const code = await ethers.provider.getCode(SPECIAL_ADDRESS);
    const isContract = code !== "0x";
    console.log(`🏠 Type: ${isContract ? 'Contrat' : 'Wallet'}`);

  } catch (error) {
    console.log("❌ Erreur vérification permissions:", error.message);
  }

  console.log("\\n📋 PLAN D'ACTION:");
  console.log("=================");

  console.log("1. 🔄 Déployer contrat mis à jour avec fonction exceptionnelle");
  console.log("2. 📤 Transférer 2.5 milliards CVTC vers le contrat swap");
  console.log("3. 🚀 Appeler emergencyInitWithTransfer() depuis l'adresse spéciale");
  console.log("4. ✅ Pool initialisé avec ratio 0.00002/2.5B");

  console.log("\\n⚠️ IMPORTANT:");
  console.log("=============");
  console.log("❌ PAS de mint automatique");
  console.log("✅ Transfert direct depuis l'adresse spéciale");
  console.log("✅ Même adresse de contrat gardée");
  console.log("✅ Minimum d'actions manuelles");

  console.log("\\n🎯 OBJECTIF:");
  console.log("============");
  console.log("Ratio final: 1 BNB = 125,000,000,000 CVTC");
  console.log("Volatilité: Maximale (anti-baleine)");
  console.log("Contrôle: Total sur la liquidité");
}

main().catch(console.error);