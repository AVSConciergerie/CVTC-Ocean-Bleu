import { ethers } from "hardhat";

async function main() {
  console.log("🔍 VÉRIFICATION DES APPELS AU CONTRAT");
  console.log("=" .repeat(50));

  const contractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83";

  console.log(`🏢 Contrat: ${contractAddress}`);
  console.log("");

  // Connexion au provider BSC Testnet
  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  try {
    // Obtenir le numéro du dernier bloc
    const latestBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, latestBlock - 50); // 50 derniers blocs

    console.log(`📊 Analyse des blocs ${fromBlock} à ${latestBlock}`);

    // Obtenir toutes les transactions vers le contrat
    const history = await provider.getHistory(contractAddress, fromBlock, latestBlock);

    console.log(`📋 ${history.length} transactions trouvées vers le contrat`);
    console.log("");

    for (const tx of history.reverse()) { // Du plus récent au plus ancien
      try {
        const receipt = await provider.getTransactionReceipt(tx.hash);
        const block = await provider.getBlock(receipt.blockNumber);
        const timestamp = new Date(block.timestamp * 1000);

        console.log(`🔄 ${timestamp.toISOString()}`);
        console.log(`   De: ${tx.from}`);
        console.log(`   À: ${tx.to}`);
        console.log(`   💰 ${ethers.formatEther(tx.value)} BNB`);
        console.log(`   📋 Hash: ${tx.hash}`);

        // Si c'est un appel de fonction (pas un transfert simple)
        if (tx.data && tx.data !== "0x") {
          console.log(`   🔧 Fonction appelée: ${tx.data.slice(0, 10)}...`);
        }

        console.log("");
      } catch (error) {
        console.log(`❌ Erreur lecture tx ${tx.hash}:`, error.message);
      }
    }

  } catch (error) {
    console.error("❌ Erreur:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });