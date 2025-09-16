import { ethers } from "hardhat";

async function main() {
  console.log("🔍 VÉRIFICATION SWAPS RÉCENTS");
  console.log("============================");

  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";
  const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

  console.log(`📍 Contrat swap: ${SWAP_ADDRESS}`);
  console.log(`👤 Utilisateur: ${USER_ADDRESS}`);

  const provider = new ethers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");

  try {
    // Récupérer le numéro de bloc actuel
    const currentBlock = await provider.getBlockNumber();
    console.log(`📊 Bloc actuel: ${currentBlock}`);

    // Chercher sur les 50 derniers blocs seulement
    const fromBlock = currentBlock - 50;
    console.log(`🔍 Recherche de ${fromBlock} à ${currentBlock}`);

    // Récupérer les logs de transactions vers le contrat swap
    const logs = await provider.getLogs({
      address: SWAP_ADDRESS,
      fromBlock: fromBlock,
      toBlock: currentBlock,
      topics: [] // Tous les événements
    });

    console.log(`\\n📋 LOGS TROUVÉS: ${logs.length}`);

    if (logs.length === 0) {
      console.log(`\\n❌ AUCUN LOG TROUVÉ`);
      console.log(`Aucune activité récente sur le contrat swap`);
      return;
    }

    // Analyser les logs
    for (const log of logs) {
      console.log(`\\n🔗 Transaction: ${log.transactionHash}`);
      console.log(`📅 Bloc: ${log.blockNumber}`);
      console.log(`📊 Topics: ${log.topics.length}`);

      // Essayer de décoder si c'est un événement Bought
      if (log.topics[0] === ethers.id("Bought(address,uint256,uint256)")) {
        console.log(`🎯 ÉVÉNEMENT BOUGHT DÉTECTÉ!`);

        // Décoder les données
        const iface = new ethers.Interface([
          "event Bought(address buyer, uint256 bnbSpent, uint256 cvtcBought)"
        ]);

        try {
          const decoded = iface.decodeEventLog("Bought", log.data, log.topics);
          console.log(`👤 Acheteur: ${decoded.buyer}`);
          console.log(`💰 BNB dépensé: ${ethers.formatEther(decoded.bnbSpent)} BNB`);
          console.log(`🪙 CVTC reçu: ${ethers.formatUnits(decoded.cvtcBought, 2)} CVTC`);

          if (decoded.buyer.toLowerCase() === USER_ADDRESS.toLowerCase()) {
            console.log(`\\n🎉 SWAP DE L'UTILISATEUR TROUVÉ!`);
            console.log(`✅ Adresse correspondante`);
            console.log(`✅ Montant: ${ethers.formatUnits(decoded.cvtcBought, 2)} CVTC`);
          }
        } catch (decodeError) {
          console.log(`❌ Erreur décodage: ${decodeError.message}`);
        }
      }
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);