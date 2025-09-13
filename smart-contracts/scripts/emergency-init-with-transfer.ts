import { ethers } from "hardhat";

async function main() {
  console.log("🚨 INITIALISATION EXCEPTIONNELLE AVEC TRANSFERT");
  console.log("==============================================");

  const SPECIAL_ADDRESS = "0xFC62525a23197922002F30863Ef7B2d91B6576D0";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";

  // Paramètres d'initialisation
  const BNB_RESERVE = ethers.parseEther("0.00002"); // 0.00002 BNB
  const CVTC_RESERVE = ethers.parseUnits("2500000000", 2); // 2.5 milliards CVTC

  console.log(`👤 Adresse spéciale: ${SPECIAL_ADDRESS}`);
  console.log(`🪙 Token CVTC: ${CVTC_ADDRESS}`);
  console.log(`📍 Contrat swap: ${SWAP_ADDRESS}`);
  console.log(`💰 BNB réserve: ${ethers.formatEther(BNB_RESERVE)} BNB`);
  console.log(`🪙 CVTC réserve: ${ethers.formatUnits(CVTC_RESERVE, 2)} CVTC`);

  // Obtenir les signers
  const [owner] = await ethers.getSigners();
  console.log(`\\n👑 Owner actuel: ${owner.address}`);

  // Contrats
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);
  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  try {
    // Vérifier la liquidité
    const liquidityEnabled = await swapContract.liquidityEnabled();
    console.log(`\\n🔄 Liquidité activée: ${liquidityEnabled ? '✅ OUI' : '❌ NON'}`);

    if (!liquidityEnabled) {
      console.log("❌ Liquidité désactivée - Activation requise d'abord");
      return;
    }

    // Vérifier les réserves actuelles
    const [currentBnbReserve, currentCvtcReserve] = await swapContract.getReserves();
    console.log(`📊 Réserves actuelles: ${ethers.formatEther(currentBnbReserve)} BNB / ${ethers.formatUnits(currentCvtcReserve, 2)} CVTC`);

    if (currentBnbReserve > 0 || currentCvtcReserve > 0) {
      console.log("❌ Réserves déjà initialisées");
      return;
    }

    // Vérifier les balances du contrat
    const contractBnbBalance = await ethers.provider.getBalance(SWAP_ADDRESS);
    const contractCvtcBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);

    console.log(`\\n💰 Balance BNB contrat: ${ethers.formatEther(contractBnbBalance)} BNB`);
    console.log(`🪙 Balance CVTC contrat: ${ethers.formatUnits(contractCvtcBalance, 2)} CVTC`);

    // Vérifier si le contrat a assez de fonds
    if (contractBnbBalance < BNB_RESERVE) {
      console.log(`❌ BNB insuffisant: ${ethers.formatEther(BNB_RESERVE - contractBnbBalance)} BNB manquants`);
      return;
    }

    if (contractCvtcBalance < CVTC_RESERVE) {
      console.log(`❌ CVTC insuffisant: ${ethers.formatUnits(CVTC_RESERVE - contractCvtcBalance, 2)} CVTC manquants`);
      return;
    }

    console.log("\\n✅ Toutes les conditions remplies !");
    console.log("==================================");

    // Simuler l'appel depuis l'adresse spéciale (en utilisant owner pour test)
    console.log("\\n🚀 Simulation de l'appel emergencyInitWithTransfer()...");

    // Pour le test, on utilise l'owner, mais en production ce serait depuis SPECIAL_ADDRESS
    const initTx = await swapContract.emergencyInitWithTransfer(BNB_RESERVE, CVTC_RESERVE);
    await initTx.wait();

    console.log("✅ Initialisation réussie!");
    console.log(`🔗 Hash: ${initTx.hash}`);

    // Vérifier les nouvelles réserves
    const [newBnbReserve, newCvtcReserve] = await swapContract.getReserves();
    console.log(`\\n📊 Nouvelles réserves:`);
    console.log(`💰 BNB: ${ethers.formatEther(newBnbReserve)} BNB`);
    console.log(`🪙 CVTC: ${ethers.formatUnits(newCvtcReserve, 2)} CVTC`);

    // Calculer le ratio
    const ratio = Number(newCvtcReserve) / Number(newBnbReserve);
    console.log(`\\n📈 Ratio: 1 BNB = ${ratio.toLocaleString()} CVTC`);

    console.log("\\n🎉 INITIALISATION TERMINÉE AVEC SUCCÈS!");
    console.log("=========================================");
    console.log("✅ Pool actif avec ratio anti-baleine");
    console.log("✅ Volatilité maximale configurée");
    console.log("✅ Contrôle total sur la liquidité");

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);