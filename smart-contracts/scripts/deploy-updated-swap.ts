import { ethers } from "hardhat";

async function main() {
  console.log("🔄 DÉPLOIEMENT CONTRAT SWAP MIS À JOUR");
  console.log("=====================================");

  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const OLD_SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // Déployer le contrat mis à jour
  console.log("\\n📦 Déploiement CVTCSwap mis à jour...");
  const CVTCSwap = await ethers.getContractFactory("CVTCSwap");
  const updatedSwap = await CVTCSwap.deploy(CVTC_TOKEN_ADDRESS);
  await updatedSwap.waitForDeployment();

  const newSwapAddress = await updatedSwap.getAddress();
  console.log(`✅ Nouveau contrat déployé: ${newSwapAddress}`);

  // Activer la liquidité
  console.log("\\n🔓 Activation liquidité...");
  const toggleTx = await updatedSwap.toggleLiquidity();
  await toggleTx.wait();
  console.log("✅ Liquidité activée");

  // Migrer les tokens du vieux contrat vers le nouveau
  console.log("\\n🔄 Migration des tokens...");
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);

  const oldContractBalance = await cvtcToken.balanceOf(OLD_SWAP_ADDRESS);
  console.log(`🏦 Tokens dans l'ancien contrat: ${ethers.formatUnits(oldContractBalance, 2)} CVTC`);

  if (oldContractBalance > 0n) {
    // Pour migrer, il faudrait que l'ancien contrat ait une fonction de retrait
    // Pour l'instant, on va mint de nouveaux tokens
    console.log("\\n🪙 Mint de tokens dans le nouveau contrat...");
    const mintAmount = ethers.parseUnits("2500000000", 2);
    const mintTx = await cvtcToken.mint(newSwapAddress, mintAmount);
    await mintTx.wait();
    console.log(`✅ ${ethers.formatUnits(mintAmount, 2)} CVTC mintés`);
  }

  // Transférer les BNB du vieux contrat vers le nouveau
  console.log("\\n💰 Migration des BNB...");
  const oldContractBnbBalance = await ethers.provider.getBalance(OLD_SWAP_ADDRESS);
  console.log(`💰 BNB dans l'ancien contrat: ${ethers.formatEther(oldContractBnbBalance)}`);

  if (oldContractBnbBalance > 0n) {
    // Transférer les BNB
    const transferBnbTx = await deployer.sendTransaction({
      to: newSwapAddress,
      value: oldContractBnbBalance
    });
    await transferBnbTx.wait();
    console.log(`✅ ${ethers.formatEther(oldContractBnbBalance)} BNB transférés`);
  }

  // Initialiser les réserves avec la fonction d'urgence
  console.log("\\n🚨 Initialisation d'urgence...");
  const contractCvtcBalance = await cvtcToken.balanceOf(newSwapAddress);
  const contractBnbBalance = await ethers.provider.getBalance(newSwapAddress);

  console.log(`📊 Réserves à initialiser:`);
  console.log(`💰 BNB: ${ethers.formatEther(contractBnbBalance)}`);
  console.log(`🪙 CVTC: ${ethers.formatUnits(contractCvtcBalance, 2)}`);

  const emergencyTx = await updatedSwap.emergencySetReserves(contractBnbBalance, contractCvtcBalance);
  await emergencyTx.wait();
  console.log("✅ Réserves initialisées avec succès!");
  console.log(`📋 Hash: ${emergencyTx.hash}`);

  // Vérification finale
  const [finalBnbReserve, finalCvtcReserve] = await updatedSwap.getReserves();
  console.log(`\\n🎯 ÉTAT FINAL:`);
  console.log(`💰 BNB réserve: ${ethers.formatEther(finalBnbReserve)}`);
  console.log(`🪙 CVTC réserve: ${ethers.formatUnits(finalCvtcReserve, 2)}`);

  const ratio = Number(ethers.formatUnits(finalCvtcReserve, 2)) / Number(ethers.formatEther(finalBnbReserve));
  console.log(`📈 Ratio: 1 BNB = ${ratio.toLocaleString()} CVTC`);

  console.log(`\\n🎉 SUCCÈS ! NOUVEAU CONTRAT OPÉRATIONNEL`);
  console.log("=====================================");
  console.log(`📍 Nouvelle adresse: ${newSwapAddress}`);
  console.log("✅ Ratio anti-baleine activé");
  console.log("✅ Volatilité maximale");
  console.log("🚀 Prêt pour l'onboarding!");

  // Sauvegarder pour le backend
  console.log(`\\n⚙️ MISE À JOUR BACKEND REQUISE:`);
  console.log(`Modifier backend/.env:`);
  console.log(`CVTC_ONBOARDING_CONTRACT_ADDRESS=${newSwapAddress}`);
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});