import { ethers } from "hardhat";

async function main() {
  console.log("🔍 ANALYSE HISTORIQUE CONTRAT SWAP");
  console.log("==================================");

  const SWAP_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932";
  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  try {
    // Récupérer les 20 dernières transactions vers le contrat
    const currentBlock = await provider.getBlockNumber();
    console.log(`📊 Bloc actuel: ${currentBlock}`);

    const logs = await provider.getLogs({
      address: SWAP_ADDRESS,
      fromBlock: currentBlock - 50,
      toBlock: currentBlock,
      topics: [] // Tous les événements
    });

    console.log(`\\n📋 ${logs.length} TRANSACTION(S) TROUVÉE(S):`);

    let totalBnbIn = 0;
    let totalBnbOut = 0;
    let totalCvtcIn = 0;
    let totalCvtcOut = 0;

    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i];
      const tx = await provider.getTransaction(log.transactionHash);
      const receipt = await provider.getTransactionReceipt(log.transactionHash);

      console.log(`\\n🔗 TRANSACTION ${logs.length - i}:`);
      console.log(`📅 Bloc: ${log.blockNumber}`);
      console.log(`⏰ Timestamp: ${new Date((await provider.getBlock(log.blockNumber)).timestamp * 1000).toLocaleString()}`);
      console.log(`👤 De: ${tx.from}`);
      console.log(`📍 Vers: ${tx.to}`);
      console.log(`💰 Valeur: ${ethers.formatEther(tx.value)} BNB`);
      console.log(`📊 Gas utilisé: ${receipt.gasUsed}`);

      // Analyser les événements
      if (log.topics[0] === ethers.id("Bought(address,uint256,uint256)")) {
        console.log(`🎯 ÉVÉNEMENT: SWAP (Bought)`);

        const iface = new ethers.Interface([
          "event Bought(address buyer, uint256 bnbSpent, uint256 cvtcBought)"
        ]);

        try {
          const decoded = iface.decodeEventLog("Bought", log.data, log.topics);
          console.log(`👤 Acheteur: ${decoded.buyer}`);
          console.log(`💰 BNB dépensé: ${ethers.formatEther(decoded.bnbSpent)} BNB`);
          console.log(`🪙 CVTC reçu: ${ethers.formatUnits(decoded.cvtcBought, 2)} CVTC`);

          totalBnbIn += Number(ethers.formatEther(decoded.bnbSpent));
          totalCvtcOut += Number(ethers.formatUnits(decoded.cvtcBought, 2));

        } catch (decodeError) {
          console.log(`❌ Erreur décodage: ${decodeError.message}`);
        }
      }

      // Autres événements
      else if (log.topics[0] === ethers.id("LiquidityAdded(uint256,uint256)")) {
        console.log(`💧 ÉVÉNEMENT: Liquidité ajoutée`);

        const iface = new ethers.Interface([
          "event LiquidityAdded(uint256 bnbAmount, uint256 cvtcAmount)"
        ]);

        try {
          const decoded = iface.decodeEventLog("LiquidityAdded", log.data, log.topics);
          console.log(`💰 BNB ajouté: ${ethers.formatEther(decoded.bnbAmount)} BNB`);
          console.log(`🪙 CVTC ajouté: ${ethers.formatUnits(decoded.cvtcAmount, 2)} CVTC`);

          totalBnbIn += Number(ethers.formatEther(decoded.bnbAmount));
          totalCvtcIn += Number(ethers.formatUnits(decoded.cvtcAmount, 2));

        } catch (decodeError) {
          console.log(`❌ Erreur décodage: ${decodeError.message}`);
        }
      }
    }

    console.log(`\\n📊 RÉSUMÉ DES FLUX:`);
    console.log(`💰 BNB entrant: ${totalBnbIn} BNB`);
    console.log(`💸 BNB sortant: ${totalBnbOut} BNB`);
    console.log(`🪙 CVTC entrant: ${totalCvtcIn.toLocaleString()} CVTC`);
    console.log(`📤 CVTC sortant: ${totalCvtcOut.toLocaleString()} CVTC`);

    console.log(`\\n⚖️ SOLDE THÉORIQUE:`);
    console.log(`💰 BNB: ${(totalBnbIn - totalBnbOut).toFixed(6)} BNB`);
    console.log(`🪙 CVTC: ${(totalCvtcIn - totalCvtcOut).toLocaleString()} CVTC`);

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);