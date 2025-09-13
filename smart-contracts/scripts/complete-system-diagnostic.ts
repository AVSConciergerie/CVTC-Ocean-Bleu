import { ethers } from "hardhat";

async function main() {
  console.log("🔍 DIAGNOSTIC COMPLET DU SYSTÈME");
  console.log("================================");

  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";
  const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  console.log(`📍 Contrat Swap: ${SWAP_ADDRESS}`);
  console.log(`👤 Utilisateur: ${USER_ADDRESS}`);
  console.log(`🪙 Token CVTC: ${CVTC_ADDRESS}`);

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);

  try {
    // 1. VÉRIFICATION DES SOLDES
    console.log(`\\n💰 1. VÉRIFICATION DES SOLDES:`);

    const userBalance = await cvtcToken.balanceOf(USER_ADDRESS);
    const contractBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
    const contractBnbBalance = await ethers.provider.getBalance(SWAP_ADDRESS);

    console.log(`👤 Solde utilisateur: ${ethers.formatUnits(userBalance, 2)} CVTC`);
    console.log(`🏢 Solde contrat CVTC: ${ethers.formatUnits(contractBalance, 2)} CVTC`);
    console.log(`🏢 Solde contrat BNB: ${ethers.formatEther(contractBnbBalance)} BNB`);

    // 2. VÉRIFICATION DES RÉSERVES
    console.log(`\\n💰 2. VÉRIFICATION DES RÉSERVES:`);

    const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
    console.log(`📊 Réserve BNB: ${ethers.formatEther(bnbReserve)} BNB`);
    console.log(`📊 Réserve CVTC: ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);

    // 3. CALCUL DU RATIO
    console.log(`\\n📈 3. ANALYSE DU RATIO:`);

    if (bnbReserve > 0 && cvtcReserve > 0) {
      const currentRatio = Number(ethers.formatUnits(cvtcReserve, 2)) / Number(ethers.formatEther(bnbReserve));
      const expectedRatio = 125000000000000; // 125 trillions

      console.log(`📊 Ratio actuel: 1 BNB = ${currentRatio.toLocaleString()} CVTC`);
      console.log(`🎯 Ratio attendu: 1 BNB = ${expectedRatio.toLocaleString()} CVTC`);
      console.log(`⚖️ Écart: ${(expectedRatio - currentRatio).toLocaleString()} CVTC`);

      if (Math.abs(currentRatio - expectedRatio) < 1000000) {
        console.log(`✅ Ratio correct`);
      } else {
        console.log(`❌ Ratio incorrect - Problème détecté`);
      }
    }

    // 4. VÉRIFICATION DE LA WHITELIST
    console.log(`\\n🔐 4. VÉRIFICATION WHITELIST:`);

    // Note: On ne peut pas lire directement la whitelist depuis l'extérieur
    console.log(`ℹ️ Impossible de vérifier la whitelist depuis l'extérieur`);
    console.log(`✅ L'utilisateur devrait être whitelisted selon le backend`);

    // 5. VÉRIFICATION DE LA LIQUIDITÉ
    console.log(`\\n🔄 5. VÉRIFICATION LIQUIDITÉ:`);

    const liquidityEnabled = await swapContract.liquidityEnabled();
    console.log(`🔄 Liquidité activée: ${liquidityEnabled ? '✅ OUI' : '❌ NON'}`);

    // 6. VÉRIFICATION DES FONCTIONS
    console.log(`\\n🔧 6. VÉRIFICATION FONCTIONS:`);

    const functions = ['buy', 'buyForUser', 'getReserves', 'cvtcToken'];
    for (const func of functions) {
      try {
        const selector = swapContract.interface.getFunction(func);
        console.log(`✅ ${func}() - Disponible`);
      } catch (e) {
        console.log(`❌ ${func}() - Non trouvée`);
      }
    }

    // 7. ANALYSE DES INCOHÉRENCES
    console.log(`\\n⚠️ 7. ANALYSE DES INCOHÉRENCES:`);

    const backendClaims = 2500000000; // Selon backend
    const blockchainShows = Number(ethers.formatUnits(userBalance, 2));

    console.log(`📊 Backend prétend: ${backendClaims.toLocaleString()} CVTC`);
    console.log(`⛓️ Blockchain montre: ${blockchainShows.toLocaleString()} CVTC`);
    console.log(`⚖️ Écart: ${(backendClaims - blockchainShows).toLocaleString()} CVTC`);

    if (backendClaims !== blockchainShows) {
      console.log(`\\n🚨 PROBLÈME CRITIQUE DÉTECTÉ:`);
      console.log(`- Le backend et la blockchain sont désynchronisés`);
      console.log(`- Les swaps n'ont pas eu lieu sur la blockchain`);
      console.log(`- L'utilisateur n'a pas reçu les tokens`);
    }

    // 8. RECOMMANDATIONS
    console.log(`\\n💡 8. RECOMMANDATIONS:`);

    if (!liquidityEnabled) {
      console.log(`❌ Activer la liquidité d'abord`);
    }

    if (contractBalance < ethers.parseUnits("2500000000", 2)) {
      console.log(`❌ Ajouter 2.5 milliards CVTC au contrat`);
    }

    if (contractBnbBalance < ethers.parseEther("0.00002")) {
      console.log(`❌ Ajouter 0.00002 BNB au contrat`);
    }

    if (backendClaims !== blockchainShows) {
      console.log(`❌ Synchroniser backend et blockchain`);
      console.log(`❌ Exécuter le vrai swap pour l'utilisateur`);
    }

    console.log(`\\n🎯 CONCLUSION:`);
    if (liquidityEnabled &&
        contractBalance >= ethers.parseUnits("2500000000", 2) &&
        contractBnbBalance >= ethers.parseEther("0.00002") &&
        backendClaims === blockchainShows) {
      console.log(`✅ Système opérationnel`);
    } else {
      console.log(`❌ Corrections nécessaires`);
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);