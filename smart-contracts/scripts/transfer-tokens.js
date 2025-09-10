const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 TRANSFERT DIRECT DES CVTC TOKENS");
  console.log("===================================");

  // Adresses
  const contractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83"; // Contrat qui détient les tokens
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3"; // Token CVTC
  const userAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389"; // Ton adresse

  // ABI simplifié pour les fonctions de base
  const contractABI = [
    "function transfer(address to, uint256 amount) returns (bool)",
    "function balanceOf(address) view returns (uint256)"
  ];

  // Connexion au contrat
  const [signer] = await ethers.getSigners();
  const contract = new ethers.Contract(contractAddress, contractABI, signer);

  try {
    console.log(`📍 Contrat source: ${contractAddress}`);
    console.log(`🎯 Adresse destination: ${userAddress}`);
    console.log(`💰 Montant: 311040 CVTC`);

    // Vérifier le solde avant
    const balanceBefore = await contract.balanceOf(userAddress);
    console.log(`💰 Solde avant: ${ethers.formatUnits(balanceBefore, 2)} CVTC`);

    // Transfert des tokens
    console.log("🔄 Transfert en cours...");
    const tx = await contract.transfer(userAddress, ethers.parseUnits("3110.4", 2));
    console.log(`✅ Transaction envoyée: ${tx.hash}`);

    // Attendre la confirmation
    await tx.wait();
    console.log("🎉 Transaction confirmée!");

    // Vérifier le solde après
    const balanceAfter = await contract.balanceOf(userAddress);
    console.log(`💰 Solde après: ${ethers.formatUnits(balanceAfter, 2)} CVTC`);

    console.log("🎯 Transfert réussi! Tes 3110.4 CVTC sont maintenant dans ton wallet!");

  } catch (error) {
    console.error("❌ Erreur lors du transfert:", error.message);

    // Si ça ne marche pas, essayer avec l'ABI ERC20 standard
    console.log("🔄 Tentative avec ABI ERC20 standard...");
    const erc20ABI = [
      "function transfer(address to, uint256 amount) returns (bool)",
      "function balanceOf(address) view returns (uint256)"
    ];

    try {
      const tokenContract = new ethers.Contract(cvtcTokenAddress, erc20ABI, signer);
      const tx = await tokenContract.transfer(userAddress, ethers.parseUnits("3110.4", 2));
      console.log(`✅ Transaction ERC20 envoyée: ${tx.hash}`);
      await tx.wait();
      console.log("🎉 Transfert ERC20 réussi!");
    } catch (erc20Error) {
      console.error("❌ Erreur ERC20:", erc20Error.message);
      console.log("💡 Le contrat n'est peut-être pas un ERC20 standard ou tu n'es pas le propriétaire");
    }
  }
}

main().catch((error) => {
  console.error("❌ Erreur générale:", error);
  process.exitCode = 1;
});