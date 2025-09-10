import { ethers } from "hardhat";

async function main() {
  console.log("🔍 INVESTIGATION : Transactions du contrat CVTCPremium");
  console.log("=" .repeat(60));

  const contractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83";
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  console.log(`🏢 Contrat: ${contractAddress}`);
  console.log(`🪙 Token CVTC: ${cvtcTokenAddress}`);
  console.log("");

  // Connexion au provider BSC Testnet
  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  console.log("📋 RECHERCHE DES TRANSACTIONS CVTC DU CONTRAT :");
  console.log("-" .repeat(50));

  try {
    // Obtenir le numéro du dernier bloc
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, latestBlock - 200); // 200 derniers blocs

    console.log(`📊 Analyse des blocs ${fromBlock} à ${latestBlock}`);

    // Filtrer les transactions CVTC impliquant le contrat
    const transferTopic = ethers.id("Transfer(address,address,uint256)");

    const filter = {
      address: cvtcTokenAddress,
      topics: [transferTopic],
      fromBlock: fromBlock,
    };

    const logs = await provider.getLogs(filter);

    console.log(`📊 ${logs.length} transactions CVTC trouvées`);
    console.log("");

    let contractTransactions = 0;

    // Analyser les transactions
    for (let i = logs.length - 1; i >= 0; i--) { // Du plus récent au plus ancien
      const log = logs[i];

      try {
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
          ["address", "address", "uint256"],
          log.data
        );

        const from = decoded[0];
        const to = decoded[1];
        const amount = decoded[2];

        // Vérifier si le contrat est impliqué
        if (from.toLowerCase() === contractAddress.toLowerCase() ||
            to.toLowerCase() === contractAddress.toLowerCase()) {

          contractTransactions++;

          const block = await provider.getBlock(log.blockNumber);
          const timestamp = new Date(block.timestamp * 1000);

          console.log(`🔄 ${timestamp.toISOString()}`);
          console.log(`   De: ${from}`);
          console.log(`   À:  ${to}`);
          console.log(`   💰 ${ethers.formatEther(amount)} CVTC`);
          console.log(`   📋 Hash: ${log.transactionHash}`);
          console.log("");

          if (contractTransactions >= 10) break; // Limiter à 10 transactions
        }
      } catch (error) {
        continue;
      }
    }

    if (contractTransactions === 0) {
      console.log("❌ Aucune transaction trouvée pour ce contrat");
    }

  } catch (error) {
    console.error("❌ Erreur lors de la récupération des logs:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });