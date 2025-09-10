import { ethers } from "hardhat";

async function main() {
  console.log("🔧 Debug de l'erreur 'Adresse deleguee invalide'...");

  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");

  // Adresses
  const transferContractAddress = "0xAEfFf843E171A6f022F0D06Bfd85998275a8D2D6";
  const tokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const smartAccountAddress = "0x71438578893865F0664EdC067B10263c2CF92a1b";
  const recipientAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";

  console.log("🔍 Analyse des adresses :");
  console.log(`🏢 Contrat Transfer: ${transferContractAddress}`);
  console.log(`🪙 Token CVTC: ${tokenAddress}`);
  console.log(`📱 Smart Account: ${smartAccountAddress}`);
  console.log(`🎯 Destinataire: ${recipientAddress}`);

  // ABI du contrat de transfert
  const transferAbi = [
    "function transfer(address receiver, uint256 amount) external",
    "function cvtcToken() external view returns (address)",
    "function getTransferStats() external view returns (uint256, uint256, uint256)"
  ];

  // ABI du token CVTC
  const tokenAbi = [
    "function balanceOf(address) external view returns (uint256)",
    "function allowance(address, address) external view returns (uint256)",
    "function decimals() external view returns (uint8)"
  ];

  try {
    // Vérifier le contrat de transfert
    console.log("\n🏢 VÉRIFICATION CONTRAT TRANSFER :");
    const transferContract = new ethers.Contract(transferContractAddress, transferAbi, provider);

    const cvtcTokenFromContract = await transferContract.cvtcToken();
    console.log(`✅ Token CVTC configuré: ${cvtcTokenFromContract}`);

    if (cvtcTokenFromContract.toLowerCase() !== tokenAddress.toLowerCase()) {
      console.log("❌ MISMATCH: Token CVTC différent dans le contrat !");
      console.log(`   Attendu: ${tokenAddress}`);
      console.log(`   Configuré: ${cvtcTokenFromContract}`);
    } else {
      console.log("✅ Token CVTC correctement configuré");
    }

    const stats = await transferContract.getTransferStats();
    console.log(`📊 Stats: ${stats[0]} transferts, ${stats[1]} releases, ${stats[2]} actifs`);

    // Vérifier le token CVTC
    console.log("\n🪙 VÉRIFICATION TOKEN CVTC :");
    const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);

    const decimals = await tokenContract.decimals();
    console.log(`✅ Décimales: ${decimals}`);

    const smartAccountBalance = await tokenContract.balanceOf(smartAccountAddress);
    console.log(`💰 Solde Smart Account: ${ethers.formatUnits(smartAccountBalance, decimals)} CVTC`);

    // Vérifier l'allowance
    const allowance = await tokenContract.allowance(smartAccountAddress, transferContractAddress);
    console.log(`🔓 Allowance: ${ethers.formatUnits(allowance, decimals)} CVTC`);

    // Vérifier l'adresse du destinataire
    console.log("\n🎯 VÉRIFICATION DESTINATAIRE :");
    const recipientBalance = await tokenContract.balanceOf(recipientAddress);
    console.log(`💰 Solde destinataire: ${ethers.formatUnits(recipientBalance, decimals)} CVTC`);

    // Vérifier si l'adresse est valide
    if (recipientAddress === ethers.ZeroAddress) {
      console.log("❌ Adresse destinataire invalide (ZeroAddress)");
    } else if (recipientAddress === smartAccountAddress) {
      console.log("❌ Destinataire = Smart Account (transfert à soi-même)");
    } else {
      console.log("✅ Adresse destinataire valide");
    }

    // Simulation de la transaction
    console.log("\n🎯 SIMULATION DE LA TRANSACTION :");

    const testAmount = ethers.parseUnits("199", decimals);
    console.log(`💸 Montant test: ${ethers.formatUnits(testAmount, decimals)} CVTC`);

    // Vérifier les conditions préalables
    if (smartAccountBalance < testAmount) {
      console.log("❌ SOLDE INSUFFISANT");
      console.log(`   Disponible: ${ethers.formatUnits(smartAccountBalance, decimals)} CVTC`);
      console.log(`   Requis: ${ethers.formatUnits(testAmount, decimals)} CVTC`);
    } else {
      console.log("✅ Solde suffisant");
    }

    if (allowance < testAmount) {
      console.log("❌ ALLOWANCE INSUFFISANTE");
      console.log(`   Disponible: ${ethers.formatUnits(allowance, decimals)} CVTC`);
      console.log(`   Requis: ${ethers.formatUnits(testAmount, decimals)} CVTC`);
    } else {
      console.log("✅ Allowance suffisante");
    }

    // Essayer d'estimer le gas
    console.log("\n⛽ ESTIMATION DU GAS :");
    try {
      const transferData = new ethers.Interface(transferAbi).encodeFunctionData("transfer", [recipientAddress, testAmount]);
      console.log("📝 Données encodées:", transferData);

      // Estimation avec un compte fictif (pour test)
      const fakeSigner = new ethers.Wallet(ethers.hexlify(ethers.randomBytes(32)), provider);
      const transferWithSigner = transferContract.connect(fakeSigner);

      const estimatedGas = await transferWithSigner.transfer.estimateGas(recipientAddress, testAmount);
      console.log(`⛽ Gas estimé: ${estimatedGas.toString()}`);

    } catch (gasError: any) {
      console.log("❌ Erreur d'estimation gas:", gasError.message);

      if (gasError.message.includes("insufficient funds")) {
        console.log("   Cause: Solde insuffisant pour le compte de test");
      } else if (gasError.message.includes("execution reverted")) {
        console.log("   Cause: Transaction rejetée par le contrat");
        console.log("   Détail:", gasError.message);
      }
    }

  } catch (error: any) {
    console.error("❌ Erreur générale:", error.message);

    if (error.message.includes("network")) {
      console.log("🌐 Problème de réseau");
    } else if (error.message.includes("call revert")) {
      console.log("🔄 Contrat rejetant l'appel");
    }
  }

  console.log("\n🎯 Debug terminé");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});