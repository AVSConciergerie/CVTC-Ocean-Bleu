import { ethers } from "hardhat";

async function main() {
  console.log("🔍 VÉRIFICATION DERNIÈRE TRANSACTION SWAP");
  console.log("=========================================");

  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";
  const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  try {
    // Récupérer les dernières transactions du contrat
    const currentBlock = await provider.getBlockNumber();
    console.log(`📊 Bloc actuel: ${currentBlock}`);

    // Chercher sur les 20 derniers blocs
    const fromBlock = currentBlock - 20;
    console.log(`🔍 Recherche de ${fromBlock} à ${currentBlock}`);

    const logs = await provider.getLogs({
      address: SWAP_ADDRESS,
      fromBlock: fromBlock,
      toBlock: currentBlock,
      topics: [] // Tous les événements
    });

    console.log(`\\n📋 ${logs.length} LOGS TROUVÉS:`);

    let foundSwap = false;
    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i];
      console.log(`\\n🔗 Transaction ${logs.length - i}: ${log.transactionHash}`);
      console.log(`📅 Bloc: ${log.blockNumber}`);

      // Vérifier si c'est un événement Bought
      if (log.topics[0] === ethers.id("Bought(address,uint256,uint256)")) {
        console.log(`🎯 ÉVÉNEMENT BOUGHT DÉTECTÉ!`);

        const iface = new ethers.Interface([
          "event Bought(address buyer, uint256 bnbSpent, uint256 cvtcBought)"
        ]);

        try {
          const decoded = iface.decodeEventLog("Bought", log.data, log.topics);
          console.log(`👤 Acheteur: ${decoded.buyer}`);
          console.log(`💰 BNB dépensé: ${ethers.formatEther(decoded.bnbSpent)} BNB`);
          console.log(`🪙 CVTC reçu: ${ethers.formatUnits(decoded.cvtcBought, 2)} CVTC`);

          if (decoded.buyer.toLowerCase() === USER_ADDRESS.toLowerCase()) {
            console.log(`\\n✅ SWAP DE L'UTILISATEUR TROUVÉ!`);
            foundSwap = true;
            break;
          }
        } catch (decodeError) {
          console.log(`❌ Erreur décodage: ${decodeError.message}`);
        }
      }
    }

    if (!foundSwap) {
      console.log(`\\n❌ AUCUN SWAP TROUVÉ POUR L'UTILISATEUR`);
      console.log(`📝 CONCLUSION: Le swap n'a jamais eu lieu`);
      console.log(`💡 CAUSE POSSIBLE: Erreur dans l'exécution ou les conditions`);

      console.log(`\\n🔧 ACTIONS IMMÉDIATES:`);
      console.log(`1. Vérifier les conditions du contrat`);
      console.log(`2. Vérifier le solde de l'opérateur`);
      console.log(`3. Vérifier la whitelist`);
      console.log(`4. Réexécuter le swap correctement`);
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);