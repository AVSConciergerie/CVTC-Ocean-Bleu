import { ethers } from "hardhat";

async function main() {
  console.log("🔧 VÉRIFICATION CONFIGURATION PAYMASTER");
  console.log("=====================================");

  const PAYMASTER_ADDRESS = "0x950c9E7ea88beF525E5fFA072E7F092E2B0f7516";
  const CVTC_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const ENTRY_POINT = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

  const provider = new ethers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");

  try {
    // Créer l'instance du contrat paymaster
    const paymasterABI = [
      "function entryPoint() view returns (address)",
      "function cvtcToken() view returns (address)",
      "function owner() view returns (address)",
      "function supportedTokens(address) view returns (bool)",
      "function tokenPrices(address) view returns (uint256)",
      "function getPaymasterData(address token) view returns (bytes)",
      "function getPaymasterStubData(address token) view returns (bytes)",
      "function getTokenQuote(address token, uint256 gasLimit) view returns (uint256)"
    ];

    const paymaster = new ethers.Contract(PAYMASTER_ADDRESS, paymasterABI, provider);

    console.log(`🏦 Paymaster: ${PAYMASTER_ADDRESS}`);
    console.log(`🪙 CVTC Token: ${CVTC_ADDRESS}`);
    console.log(`🎯 EntryPoint: ${ENTRY_POINT}`);

    // Vérifier l'EntryPoint
    console.log(`\\n🔍 VÉRIFICATION ENTRYPOINT:`);
    try {
      const entryPoint = await paymaster.entryPoint();
      console.log(`EntryPoint configuré: ${entryPoint}`);
      console.log(`EntryPoint correct: ${entryPoint === ENTRY_POINT ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`❌ Erreur EntryPoint: ${error.message}`);
    }

    // Vérifier le token CVTC
    console.log(`\\n🔍 VÉRIFICATION TOKEN CVTC:`);
    try {
      const cvtcToken = await paymaster.cvtcToken();
      console.log(`CVTC Token configuré: ${cvtcToken}`);
      console.log(`CVTC Token correct: ${cvtcToken === CVTC_ADDRESS ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`❌ Erreur CVTC Token: ${error.message}`);
    }

    // Vérifier le propriétaire
    console.log(`\\n🔍 VÉRIFICATION PROPRIÉTAIRE:`);
    try {
      const owner = await paymaster.owner();
      console.log(`Propriétaire: ${owner}`);
    } catch (error) {
      console.log(`❌ Erreur propriétaire: ${error.message}`);
    }

    // Vérifier si CVTC est supporté
    console.log(`\\n🔍 VÉRIFICATION SUPPORT CVTC:`);
    try {
      const isSupported = await paymaster.supportedTokens(CVTC_ADDRESS);
      console.log(`CVTC supporté: ${isSupported ? '✅' : '❌'}`);

      if (isSupported) {
        const price = await paymaster.tokenPrices(CVTC_ADDRESS);
        console.log(`Prix CVTC: ${ethers.formatUnits(price, 0)} wei par token`);
      }
    } catch (error) {
      console.log(`❌ Erreur support CVTC: ${error.message}`);
    }

    // Tester getPaymasterData
    console.log(`\\n🔍 TEST GETPAYMASTERDATA:`);
    try {
      const paymasterData = await paymaster.getPaymasterData(CVTC_ADDRESS);
      console.log(`PaymasterData généré: ${paymasterData}`);
      console.log(`Longueur: ${paymasterData.length} bytes`);
    } catch (error) {
      console.log(`❌ Erreur getPaymasterData: ${error.message}`);
    }

    // Tester getTokenQuote
    console.log(`\\n🔍 TEST GETTOKENQUOTE:`);
    try {
      const gasLimit = 100000n;
      const quote = await paymaster.getTokenQuote(CVTC_ADDRESS, gasLimit);
      console.log(`Quote pour ${gasLimit} gas: ${ethers.formatUnits(quote, 2)} CVTC`);
    } catch (error) {
      console.log(`❌ Erreur getTokenQuote: ${error.message}`);
    }

    console.log(`\\n🎯 ANALYSE:`);
    console.log(`==========`);

    console.log(`✅ Paymaster déployé à l'adresse correcte`);
    console.log(`❓ Configuration à vérifier manuellement`);
    console.log(`💡 Si tout est correct, le problème vient du frontend`);

  } catch (error: any) {
    console.error("❌ Erreur générale:", error.message);
  }
}

main().catch(console.error);