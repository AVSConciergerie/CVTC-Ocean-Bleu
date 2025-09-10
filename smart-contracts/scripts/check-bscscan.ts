import fetch from "node-fetch";

async function main() {
  console.log("🔍 VÉRIFICATION VIA BSCSCAN");
  console.log("=" .repeat(50));

  const userAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  console.log(`👤 Adresse: ${userAddress}`);
  console.log(`🪙 Token: ${cvtcTokenAddress}`);
  console.log("");

  // API BSCScan (nécessite une clé API gratuite)
  const apiKey = process.env.BSCSCAN_API_KEY || ""; // Clé API optionnelle
  const baseUrl = "https://api-testnet.bscscan.com/api";

  try {
    // 1. Vérifier le solde du token
    console.log("📊 SOLDE DU TOKEN :");
    const balanceUrl = `${baseUrl}?module=account&action=tokenbalance&contractaddress=${cvtcTokenAddress}&address=${userAddress}&tag=latest&apikey=${apiKey}`;

    const balanceResponse = await fetch(balanceUrl);
    const balanceData = await balanceResponse.json();

    if (balanceData.status === "1") {
      const balance = parseFloat(balanceData.result) / Math.pow(10, 18); // 18 décimales
      console.log(`👤 Solde utilisateur: ${balance} CVTC`);
    } else {
      console.log(`❌ Erreur solde: ${balanceData.message}`);
    }

    // 2. Récupérer les dernières transactions du token
    console.log("\n📋 DERNIÈRES TRANSACTIONS :");
    const txUrl = `${baseUrl}?module=account&action=tokentx&contractaddress=${cvtcTokenAddress}&address=${userAddress}&page=1&offset=10&sort=desc&apikey=${apiKey}`;

    const txResponse = await fetch(txUrl);
    const txData = await txResponse.json();

    if (txData.status === "1" && txData.result.length > 0) {
      console.log(`📊 ${txData.result.length} transactions trouvées`);
      console.log("");

      txData.result.forEach((tx: any, index: number) => {
        const value = parseFloat(tx.value) / Math.pow(10, 18);
        const timestamp = new Date(parseInt(tx.timeStamp) * 1000);

        console.log(`${index + 1}. ${timestamp.toISOString()}`);
        console.log(`   De: ${tx.from}`);
        console.log(`   À:  ${tx.to}`);
        console.log(`   💰 ${value} CVTC`);
        console.log(`   📋 Hash: ${tx.hash}`);
        console.log("");
      });
    } else {
      console.log("❌ Aucune transaction trouvée ou erreur API");
      console.log(`Détails: ${txData.message}`);
    }

  } catch (error) {
    console.error("❌ Erreur:", error);
    console.log("\n💡 Conseils:");
    console.log("1. Vérifier manuellement sur https://testnet.bscscan.com/");
    console.log("2. Chercher l'adresse du token et les transactions");
    console.log("3. Utiliser l'onglet 'Token Transfers'");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });