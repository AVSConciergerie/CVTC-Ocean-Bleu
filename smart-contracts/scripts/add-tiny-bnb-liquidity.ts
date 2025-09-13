import { ethers } from "hardhat";

async function main() {
  console.log("💰 AJOUT LIQUIDITÉ MINIATURE (STRATÉGIE ANTI-BALEINE)");
  console.log("====================================================");

  const SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // Vérifier le solde BNB actuel
  const bnbBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Solde BNB actuel: ${ethers.formatEther(bnbBalance)} BNB`);

  // Vérifier les tokens CVTC dans l'ancien contrat
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);
  const contractCvtcBalance = await cvtcToken.balanceOf(SWAP_ADDRESS);
  console.log(`🏦 CVTC dans le contrat: ${ethers.formatUnits(contractCvtcBalance, 2)} CVTC`);

  // Obtenir le contrat swap
  const swapContract = await ethers.getContractAt("CVTCSwap", SWAP_ADDRESS);

  // Vérifier l'état actuel des réserves
  console.log("\\n📊 ÉTAT ACTUEL:");
  try {
    const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
    console.log(`💰 Réserve BNB: ${ethers.formatEther(bnbReserve)}`);
    console.log(`🪙 Réserve CVTC: ${ethers.formatUnits(cvtcReserve, 2)}`);
  } catch (error) {
    console.log("❌ Impossible de lire les réserves:", error.message);
  }

  // Montant minuscule de BNB à ajouter
  const tinyBnbAmount = ethers.parseEther("0.00002");
  console.log(`\\n🎯 MONTANT À AJOUTER: ${ethers.formatEther(tinyBnbAmount)} BNB`);

  // Calculer le ratio qui sera créé
  const ratio = Number(ethers.formatUnits(contractCvtcBalance, 2)) / Number(ethers.formatEther(tinyBnbAmount));
  console.log(`📈 RATIO RÉSULTANT: 1 BNB = ${ratio.toLocaleString()} CVTC`);
  console.log(`📈 RATIO INVERSE: 1 CVTC = ${(1/ratio).toFixed(10)} BNB`);

  if (bnbBalance < tinyBnbAmount) {
    console.log(`❌ Solde BNB insuffisant: ${ethers.formatEther(bnbBalance)} < ${ethers.formatEther(tinyBnbAmount)}`);
    return;
  }

  console.log("\\n🚨 STRATÉGIE ANTI-BALEINE:");
  console.log("==========================");
  console.log("✅ Ratio extrêmement déséquilibré");
  console.log("✅ Volatilité maximale pour décourager les baleines");
  console.log("✅ Pool très attractif pour petits investisseurs");
  console.log("✅ Contrôle total sur la liquidité");

  // Demander confirmation
  console.log("\\n⚠️ CONFIRMATION REQUISE:");
  console.log("Cette opération va créer un pool avec un ratio de 1:125,000,000,000");
  console.log("Les baleines seront découragées par la volatilité extrême!");

  // Pour l'instant, on simule seulement
  console.log("\\n🧪 SIMULATION:");
  console.log("Si on ajoute 0.00002 BNB aux 2.5 milliards CVTC:");
  console.log("- 1 BNB acheté = réception de 125 milliards CVTC");
  console.log("- 1 CVTC vendu = réception de 0.000000008 BNB");
  console.log("- Impact énorme sur le prix à chaque transaction");

  console.log("\\n🎯 PRÊT À EXÉCUTER:");
  console.log("Voulez-vous procéder avec cet ajout de liquidité miniature ?");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});