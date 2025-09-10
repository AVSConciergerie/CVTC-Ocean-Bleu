import { ethers } from "hardhat";

async function main() {
  console.log("🚨 DÉPLOIEMENT CONTRAT D'URGENCE");
  console.log("=" .repeat(50));

  // Adresses
  const userAddress = "0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389";
  const cvtcTokenAddress = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const oldContractAddress = "0xe094f17A086CfC7f4A1F95817aa836d40b6B0a83";

  console.log(`👤 Utilisateur: ${userAddress}`);
  console.log(`🪙 Token CVTC: ${cvtcTokenAddress}`);
  console.log(`🏢 Ancien contrat: ${oldContractAddress}`);
  console.log("");

  // Déployer un contrat d'urgence simple
  console.log("📝 Déploiement du contrat d'urgence...");

  const EmergencyTransfer = await ethers.getContractFactory("EmergencyTransfer");
  const emergencyContract = await EmergencyTransfer.deploy(cvtcTokenAddress, oldContractAddress);

  await emergencyContract.waitForDeployment();

  const emergencyAddress = await emergencyContract.getAddress();
  console.log(`✅ Contrat d'urgence déployé: ${emergencyAddress}`);

  // Transférer les tokens
  console.log("\n💰 Transfert des tokens...");

  const transferTx = await emergencyContract.emergencyTransfer(userAddress, 311040n);
  await transferTx.wait();

  console.log("✅ TRANSFERT RÉUSSI !");
  console.log(`🎉 3110.4 CVTC transférés à ${userAddress}`);
  console.log(`📋 Transaction: ${transferTx.hash}`);

  // Vérification
  const cvtcToken = await ethers.getContractAt("IERC20", cvtcTokenAddress);
  const finalBalance = await cvtcToken.balanceOf(userAddress);
  console.log(`\n📊 Solde final de l'utilisateur: ${Number(finalBalance) / Math.pow(10, 2)} CVTC`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  });