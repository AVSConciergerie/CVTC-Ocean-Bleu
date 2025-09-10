import fetch from "node-fetch";

async function main() {
  console.log("🔍 VÉRIFICATION VIA BSCSCAN API");
  console.log("=" .repeat(50));

  const contractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83";
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  console.log(`🏢 Contrat: ${contractAddress}`);
  console.log(`🪙 Token CVTC: ${cvtcTokenAddress}`);
  console.log("");

  // API BSCScan pour vérifier le solde du token
  const apiKey = ""; // Pas de clé API pour le testnet
  const baseUrl = "https://api-testnet.bscscan.com/api";

  try {
    // 1. Vérifier le solde du token pour le contrat
    console.log("📊 SOLDE DU CONTRAT :");
    const balanceUrl = `${baseUrl}?module=account&action=tokenbalance&contractaddress=${cvtcTokenAddress}&address=${contractAddress}&tag=latest&apikey=${apiKey}`;

    console.log(`🔗 URL: ${balanceUrl}`);

    const balanceResponse = await fetch(balanceUrl);
    const balanceData = await balanceResponse.json();

    console.log("📋 Réponse BSCScan:");
    console.log(JSON.stringify(balanceData, null, 2));

    if (balanceData.status === "1") {
      const balance = parseFloat(balanceData.result) / Math.pow(10, 18); // 18 décimales standard
      console.log(`✅ Solde BSCScan: ${balance} CVTC`);
      console.log(`✅ Solde en wei: ${balanceData.result}`);
    } else {
      console.log(`❌ Erreur BSCScan: ${balanceData.message}`);
    }

    // 2. Vérifier les informations du token
    console.log("\n🪙 INFO TOKEN :");
    const tokenInfoUrl = `${baseUrl}?module=token&action=tokeninfo&contractaddress=${cvtcTokenAddress}&apikey=${apiKey}`;

    const tokenResponse = await fetch(tokenInfoUrl);
    const tokenData = await tokenResponse.json();

    console.log("📋 Info token:");
    console.log(JSON.stringify(tokenData, null, 2));

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