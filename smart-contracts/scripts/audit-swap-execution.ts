import { ethers } from "hardhat";

async function main() {
  console.log("🔍 AUDIT EXÉCUTION SWAP - ANALYSE DÉTAILLÉE");
  console.log("===========================================");

  const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";
  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  console.log(`👤 Utilisateur: ${USER_ADDRESS}`);
  console.log(`📍 Contrat swap: ${SWAP_ADDRESS}`);
  console.log(`🪙 Token CVTC: ${CVTC_ADDRESS}`);

  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_ADDRESS);
  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  try {
    // 1. Vérifier le solde actuel de l'utilisateur
    const currentBalance = await cvtcToken.balanceOf(USER_ADDRESS);
    console.log(`\\n💰 SOLDE ACTUEL UTILISATEUR:`);
    console.log(`🪙 CVTC: ${ethers.formatUnits(currentBalance, 2)} CVTC`);

    // 2. Vérifier les réserves du contrat
    const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
    console.log(`\\n💰 RÉSERVES CONTRAT:`);
    console.log(`💰 BNB: ${ethers.formatEther(bnbReserve)} BNB`);
    console.log(`🪙 CVTC: ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);

    // 3. Vérifier si l'utilisateur est whitelisted
    console.log(`\\n🔍 VÉRIFICATION WHITELIST:`);
    // On ne peut pas lire directement, mais on peut tester

    // 4. Vérifier les dernières transactions
    console.log(`\\n🔄 RECHERCHE TRANSACTIONS RÉCENTES...`);

    const provider = new ethers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = currentBlock - 100; // Derniers 100 blocs

    const logs = await provider.getLogs({
      address: SWAP_ADDRESS,
      fromBlock: fromBlock,
      toBlock: currentBlock,
      topics: [] // Tous les événements
    });

    console.log(`📊 ${logs.length} logs trouvés sur le contrat swap`);

    let swapEvents = [];
    for (const log of logs) {
      try {
        if (log.topics[0] === ethers.id("Bought(address,uint256,uint256)")) {
          const iface = new ethers.Interface([
            "event Bought(address buyer, uint256 bnbSpent, uint256 cvtcBought)"
          ]);
          const decoded = iface.decodeEventLog("Bought", log.data, log.topics);

          if (decoded.buyer.toLowerCase() === USER_ADDRESS.toLowerCase()) {
            swapEvents.push({
              hash: log.transactionHash,
              block: log.blockNumber,
              buyer: decoded.buyer,
              bnbSpent: ethers.formatEther(decoded.bnbSpent),
              cvtcBought: ethers.formatUnits(decoded.cvtcBought, 2)
            });
          }
        }
      } catch (e) {
        // Ignorer les logs qui ne peuvent pas être décodés
      }
    }

    console.log(`\\n🎯 SWAPS TROUVÉS POUR ${USER_ADDRESS}:`);
    if (swapEvents.length === 0) {
      console.log(`❌ AUCUN SWAP TROUVÉ`);
      console.log(`🔍 Le swap n'a jamais été exécuté!`);
    } else {
      swapEvents.forEach((event, index) => {
        console.log(`\\n📋 SWAP ${index + 1}:`);
        console.log(`🔗 Hash: ${event.hash}`);
        console.log(`📅 Bloc: ${event.block}`);
        console.log(`💰 BNB dépensé: ${event.bnbSpent} BNB`);
        console.log(`🪙 CVTC reçu: ${event.cvtcBought} CVTC`);
      });
    }

    // 5. Vérifier l'historique des transactions de l'utilisateur
    console.log(`\\n🔍 HISTORIQUE TRANSACTIONS CVTC:`);

    const transferLogs = await provider.getLogs({
      address: CVTC_ADDRESS,
      fromBlock: fromBlock,
      toBlock: currentBlock,
      topics: [
        ethers.id("Transfer(address,address,uint256)"),
        null, // from
        ethers.zeroPadValue(USER_ADDRESS, 32) // to
      ]
    });

    console.log(`📊 ${transferLogs.length} transferts CVTC vers ${USER_ADDRESS}`);

    if (transferLogs.length === 0) {
      console.log(`❌ AUCUN TRANSFERT CVTC VERS L'UTILISATEUR`);
    } else {
      for (const log of transferLogs) {
        try {
          const iface = new ethers.Interface([
            "event Transfer(address indexed from, address indexed to, uint256 value)"
          ]);
          const decoded = iface.decodeEventLog("Transfer", log.data, log.topics);

          console.log(`\\n📤 TRANSFERT:`);
          console.log(`🔗 Hash: ${log.transactionHash}`);
          console.log(`📅 Bloc: ${log.blockNumber}`);
          console.log(`👤 De: ${decoded.from}`);
          console.log(`👤 À: ${decoded.to}`);
          console.log(`💰 Montant: ${ethers.formatUnits(decoded.value, 2)} CVTC`);
        } catch (e) {
          console.log(`❌ Erreur décodage transfert: ${log.transactionHash}`);
        }
      }
    }

    // 6. Diagnostic final
    console.log(`\\n🔬 DIAGNOSTIC FINAL:`);
    console.log(`===================`);

    if (swapEvents.length === 0) {
      console.log(`❌ PROBLÈME: Aucun swap n'a été exécuté`);
      console.log(`💡 CAUSES POSSIBLES:`);
      console.log(`   - Utilisateur pas whitelisted`);
      console.log(`   - Solde opérateur insuffisant`);
      console.log(`   - Erreur dans le contrat`);
      console.log(`   - Transaction échouée`);
    } else {
      console.log(`✅ SWAP EXÉCUTÉ: ${swapEvents.length} swap(s) trouvé(s)`);
      const totalCvtc = swapEvents.reduce((sum, event) => sum + parseFloat(event.cvtcBought), 0);
      console.log(`🪙 TOTAL CVTC DU SWAP: ${totalCvtc} CVTC`);
    }

    const expectedBalance = 2500000000; // 2.5 milliards
    const actualBalance = parseFloat(ethers.formatUnits(currentBalance, 2));

    console.log(`\\n🎯 COMPARAISON:`);
    console.log(`📊 Attendu: ${expectedBalance} CVTC`);
    console.log(`📈 Actuel: ${actualBalance} CVTC`);
    console.log(`⚖️ Différence: ${expectedBalance - actualBalance} CVTC`);

    if (actualBalance < expectedBalance) {
      console.log(`\\n❌ CONCLUSION: LE SWAP N'A PAS FONCTIONNÉ CORRECTEMENT`);
      console.log(`Les ${actualBalance} CVTC étaient déjà présents avant le swap`);
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);