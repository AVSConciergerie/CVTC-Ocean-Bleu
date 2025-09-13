import { ethers } from "hardhat";

async function main() {
  console.log("🔍 VÉRIFICATION TRANSACTIONS SWAP");
  console.log("=================================");

  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";
  const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

  console.log(`📍 Contrat swap: ${SWAP_ADDRESS}`);
  console.log(`👤 Utilisateur: ${USER_ADDRESS}`);

  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  try {
    // Récupérer tous les événements Bought récents
    const filter = swapContract.filters.Bought();
    const events = await swapContract.queryFilter(filter, -100); // Derniers 100 blocs seulement

    console.log(`\\n🔄 TOUTES LES TRANSACTIONS SWAP:`);
    console.log(`📊 Nombre total de transactions: ${events.length}`);

    // Filtrer pour l'utilisateur spécifique
    const userEvents = events.filter(event =>
      event.args[0].toLowerCase() === USER_ADDRESS.toLowerCase()
    );

    console.log(`📊 Transactions pour ${USER_ADDRESS}: ${userEvents.length}`);

    if (userEvents.length === 0) {
      console.log(`\\n❌ AUCUNE TRANSACTION TROUVÉE`);
      console.log(`Aucun swap n'a été exécuté pour cet utilisateur`);

      console.log(`\\n🔧 ACTIONS REQUISES:`);
      console.log(`1. Réexécuter le premier swap`);
      console.log(`2. Vérifier l'adresse de destination`);
      console.log(`3. Vérifier le solde de l'opérateur`);
      return;
    }

    // Afficher les détails des transactions de l'utilisateur
    for (let i = 0; i < userEvents.length; i++) {
      const event = userEvents[i];
      console.log(`\\n📋 TRANSACTION ${i + 1}:`);
      console.log(`🔗 Hash: ${event.transactionHash}`);
      console.log(`📅 Bloc: ${event.blockNumber}`);
      console.log(`👤 Acheteur: ${event.args[0]}`);
      console.log(`💰 BNB dépensé: ${ethers.formatEther(event.args[1])} BNB`);
      console.log(`🪙 CVTC reçu: ${ethers.formatUnits(event.args[2], 2)} CVTC`);
    }

    // Vérifier la dernière transaction
    const lastEvent = userEvents[userEvents.length - 1];
    const expectedAmount = ethers.parseUnits("2500000000", 2); // 2.5 milliards
    const actualAmount = lastEvent.args[2];

    console.log(`\\n🎯 VÉRIFICATION MONTANT:`);
    console.log(`📊 Montant attendu: ${ethers.formatUnits(expectedAmount, 2)} CVTC`);
    console.log(`📈 Montant réel: ${ethers.formatUnits(actualAmount, 2)} CVTC`);

    if (actualAmount >= expectedAmount) {
      console.log(`\\n✅ MONTANT CORRECT`);
      console.log(`Le swap a été exécuté avec le bon montant`);
    } else {
      console.log(`\\n❌ MONTANT INCORRECT`);
      console.log(`Le swap n'a pas donné le montant attendu`);
      const difference = expectedAmount - actualAmount;
      console.log(`Manque: ${ethers.formatUnits(difference, 2)} CVTC`);
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);