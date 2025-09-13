import { ethers } from "hardhat";

async function main() {
  console.log("🔍 VÉRIFICATION TRANSACTION PAR HASH");
  console.log("====================================");

  // Hash de la transaction prétendument exécutée
  const TX_HASH = "0x68facac2e5948de461dece927ed793807cf802b2d5e37bcd35c3d4f5e8c28d31";

  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  try {
    console.log(`🔗 Vérification transaction: ${TX_HASH}`);

    // Récupérer la transaction
    const tx = await provider.getTransaction(TX_HASH);

    if (!tx) {
      console.log(`\\n❌ TRANSACTION NON TROUVÉE`);
      console.log(`📝 CONCLUSION: La transaction n'existe pas`);
      console.log(`💡 CAUSE: Le script a menti ou il y a eu une erreur`);

      console.log(`\\n🔧 CONSÉQUENCES:`);
      console.log(`- Aucun swap n'a eu lieu`);
      console.log(`- Les 1200 CVTC étaient déjà là`);
      console.log(`- Le solde utilisateur n'a pas changé`);
      return;
    }

    console.log(`\\n✅ TRANSACTION TROUVÉE:`);
    console.log(`📅 Bloc: ${tx.blockNumber}`);
    console.log(`👤 De: ${tx.from}`);
    console.log(`📍 Vers: ${tx.to}`);
    console.log(`💰 Valeur: ${ethers.formatEther(tx.value)} BNB`);
    console.log(`📊 Gas: ${tx.gasLimit}`);

    // Récupérer le reçu de transaction
    const receipt = await provider.getTransactionReceipt(TX_HASH);
    console.log(`\\n📋 STATUT:`);
    console.log(`✅ Confirmée: ${receipt.status === 1 ? 'OUI' : 'NON'}`);
    console.log(`📊 Gas utilisé: ${receipt.gasUsed}`);

    if (receipt.status === 1) {
      console.log(`\\n✅ TRANSACTION RÉUSSIE`);

      // Vérifier les logs pour voir si c'était un swap
      if (receipt.logs && receipt.logs.length > 0) {
        console.log(`📋 ${receipt.logs.length} LOG(S) D'ÉVÉNEMENT(S):`);

        for (const log of receipt.logs) {
          if (log.address.toLowerCase() === "0x8cd8331a565769624a4735f613a44643dd2e2932") {
            console.log(`🎯 LOG DU CONTRAT SWAP:`);
            console.log(`📊 Topics: ${log.topics.length}`);

            if (log.topics[0] === ethers.id("Bought(address,uint256,uint256)")) {
              console.log(`✅ ÉVÉNEMENT BOUGHT DÉTECTÉ!`);

              const iface = new ethers.Interface([
                "event Bought(address buyer, uint256 bnbSpent, uint256 cvtcBought)"
              ]);

              try {
                const decoded = iface.decodeEventLog("Bought", log.data, log.topics);
                console.log(`👤 Acheteur: ${decoded.buyer}`);
                console.log(`💰 BNB dépensé: ${ethers.formatEther(decoded.bnbSpent)} BNB`);
                console.log(`🪙 CVTC reçu: ${ethers.formatUnits(decoded.cvtcBought, 2)} CVTC`);
              } catch (decodeError) {
                console.log(`❌ Erreur décodage: ${decodeError.message}`);
              }
            }
          }
        }
      } else {
        console.log(`📋 AUCUN LOG D'ÉVÉNEMENT`);
      }
    } else {
      console.log(`\\n❌ TRANSACTION ÉCHOUÉE`);
    }

  } catch (error) {
    console.log("❌ Erreur:", error.message);
  }
}

main().catch(console.error);