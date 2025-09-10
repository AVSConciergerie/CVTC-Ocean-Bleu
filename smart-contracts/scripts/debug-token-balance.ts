import { ethers } from "hardhat";

async function main() {
  console.log("🔧 DEBUG : Vérification détaillée du token");
  console.log("=" .repeat(50));

  const contractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83";
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const userAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";

  console.log(`🏢 Contrat: ${contractAddress}`);
  console.log(`🪙 Token CVTC: ${cvtcTokenAddress}`);
  console.log(`👤 Utilisateur: ${userAddress}`);
  console.log("");

  try {
    // Vérifier si le token existe
    const code = await ethers.provider.getCode(cvtcTokenAddress);
    console.log(`📋 Code du token: ${code.substring(0, 50)}...`);

    if (code === "0x") {
      console.log("❌ Le token n'existe pas !");
      return;
    }

    // Obtenir l'instance du token
    const cvtcToken = await ethers.getContractAt("IERC20", cvtcTokenAddress);

    // Vérifier les fonctions disponibles
    console.log("\n🔍 TESTS DES FONCTIONS :");

    try {
      const name = await cvtcToken.name();
      console.log(`📛 Nom: ${name}`);
    } catch (e) {
      console.log(`❌ Fonction name() non disponible`);
    }

    try {
      const symbol = await cvtcToken.symbol();
      console.log(`🏷️  Symbole: ${symbol}`);
    } catch (e) {
      console.log(`❌ Fonction symbol() non disponible`);
    }

    try {
      const decimals = await cvtcToken.decimals();
      console.log(`🔢 Décimales: ${decimals}`);
    } catch (e) {
      console.log(`❌ Fonction decimals() non disponible`);
    }

    try {
      const totalSupply = await cvtcToken.totalSupply();
      console.log(`🌍 Supply total: ${totalSupply.toString()} wei`);
      console.log(`🌍 Supply total: ${ethers.formatEther(totalSupply)} tokens`);
    } catch (e) {
      console.log(`❌ Fonction totalSupply() non disponible`);
    }

    console.log("\n💰 SOLDES :");

    // Solde du contrat
    const contractBalance = await cvtcToken.balanceOf(contractAddress);
    console.log(`🏢 Contrat: ${contractBalance.toString()} wei`);
    console.log(`🏢 Contrat: ${ethers.formatEther(contractBalance)} CVTC`);

    // Solde de l'utilisateur
    const userBalance = await cvtcToken.balanceOf(userAddress);
    console.log(`👤 Utilisateur: ${userBalance.toString()} wei`);
    console.log(`👤 Utilisateur: ${ethers.formatEther(userBalance)} CVTC`);

    // Vérifier l'adresse du msg.sender
    const signer = await ethers.provider.getSigner();
    const signerAddress = await signer.getAddress();
    console.log(`🎭 Signer: ${signerAddress}`);

  } catch (error) {
    console.error("❌ Erreur générale:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });