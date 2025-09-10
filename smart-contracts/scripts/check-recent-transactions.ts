import { ethers } from "hardhat";

async function main() {
  console.log("🔍 INVESTIGATION DES TRANSACTIONS RÉCENTES");
  console.log("=" .repeat(60));

  const userAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const newContractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83";

  console.log(`👤 Adresse utilisateur: ${userAddress}`);
  console.log(`🪙 Token CVTC: ${cvtcTokenAddress}`);
  console.log("");

  // Connexion au provider BSC Testnet
  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  console.log("📋 DERNIÈRES TRANSACTIONS CVTC :");
  console.log("-" .repeat(50));

  try {
    // Obtenir les logs de transfert du token CVTC
    const transferTopic = ethers.id("Transfer(address,address,uint256)");

    // Obtenir le numéro du dernier bloc
    const latestBlock = await provider.getBlockNumber();

    // Réduire la plage pour éviter le rate limit
    const fromBlock = Math.max(0, latestBlock - 100); // Seulement 100 derniers blocs

    console.log(`📊 Analyse des blocs ${fromBlock} à ${latestBlock}`);

    // Filtrer les transactions impliquant l'utilisateur
    const filter = {
      address: cvtcTokenAddress,
      topics: [transferTopic],
      fromBlock: fromBlock,
    };

    const logs = await provider.getLogs(filter);

    console.log(`📊 ${logs.length} transactions trouvées`);
    console.log("");

    // Analyser les dernières transactions
    for (let i = Math.max(0, logs.length - 10); i < logs.length; i++) {
      const log = logs[i];

      try {
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
          ["address", "address", "uint256"],
          log.data
        );

        const from = decoded[0];
        const to = decoded[1];
        const amount = decoded[2];

        const block = await provider.getBlock(log.blockNumber);
        const timestamp = new Date(block.timestamp * 1000);

        // Vérifier si l'utilisateur est impliqué
        if (from.toLowerCase() === userAddress.toLowerCase() ||
            to.toLowerCase() === userAddress.toLowerCase()) {

          console.log(`🔄 ${timestamp.toISOString()}`);
          console.log(`   De: ${from}`);
          console.log(`   À:  ${to}`);
          console.log(`   💰 ${ethers.formatEther(amount)} CVTC`);
          console.log(`   📋 Tx: ${log.transactionHash}`);
          console.log("");
        }
      } catch (error) {
        console.log(`❌ Erreur décodage log ${i}:`, error.message);
      }
    }

    console.log("🔍 ANALYSE DES RÉSULTATS :");
    console.log("-" .repeat(50));

    if (logs.length === 0) {
      console.log("❌ Aucune transaction trouvée");
    } else {
      console.log("✅ Transactions analysées");
      console.log("💡 Vérifier les adresses de destination suspectes");
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