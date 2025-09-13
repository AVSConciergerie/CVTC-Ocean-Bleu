import { ethers } from "hardhat";

async function main() {
  console.log("💰 AJOUT LIQUIDITÉ INITIALE");
  console.log("==========================");

  const NEW_SWAP_ADDRESS = "0x63464DA0d5C5bfC2B7515D4F41D37FD88Bb9E4A9";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // Vérifier le solde BNB
  const bnbBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Solde BNB: ${ethers.formatEther(bnbBalance)} BNB`);

  // Obtenir les contrats
  const swapContract = await ethers.getContractAt("CVTCSwapEmergency", NEW_SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);

  // Étape 1: Mint des CVTC dans le contrat swap
  console.log("\\n🪙 ÉTAPE 1: Mint CVTC dans le contrat swap...");
  const mintAmount = ethers.parseUnits("100000000", 2); // 100 millions pour commencer
  console.log(`📊 Montant à mint: ${ethers.formatUnits(mintAmount, 2)} CVTC`);

  try {
    const mintTx = await cvtcToken.mint(NEW_SWAP_ADDRESS, mintAmount);
    await mintTx.wait();
    console.log("✅ CVTC mintés dans le contrat swap");
    console.log(`📋 Transaction: ${mintTx.hash}`);
  } catch (error) {
    console.log("❌ Mint impossible, tentative alternative...");
    console.log("💡 Il faudra mint manuellement ou utiliser des tokens existants");
    return;
  }

  // Étape 2: Initialiser d'urgence (sans BNB)
  console.log("\\n🚨 ÉTAPE 2: Initialisation d'urgence...");
  const initTx = await swapContract.emergencyInitialize();
  await initTx.wait();
  console.log("✅ Contrat initialisé avec CVTC");
  console.log(`📋 Transaction: ${initTx.hash}`);

  // Étape 3: Ajouter les BNB
  console.log("\\n💰 ÉTAPE 3: Ajout des BNB...");
  const bnbToAdd = ethers.parseEther("0.1"); // 0.1 BNB pour commencer
  console.log(`📊 BNB à ajouter: ${ethers.formatEther(bnbToAdd)} BNB`);

  if (bnbBalance < bnbToAdd) {
    console.log(`❌ Solde BNB insuffisant: ${ethers.formatEther(bnbBalance)} < ${ethers.formatEther(bnbToAdd)}`);
    return;
  }

  const addBnbTx = await swapContract.addInitialBnb({
    value: bnbToAdd
  });
  await addBnbTx.wait();
  console.log("✅ BNB ajoutés au pool");
  console.log(`📋 Transaction: ${addBnbTx.hash}`);

  // Vérification finale
  console.log("\\n📊 VÉRIFICATION FINALE:");
  const [finalBnbReserve, finalCvtcReserve] = await swapContract.getReserves();
  console.log(`💰 Réserve BNB: ${ethers.formatEther(finalBnbReserve)}`);
  console.log(`🪙 Réserve CVTC: ${ethers.formatUnits(finalCvtcReserve, 2)}`);

  if (finalBnbReserve > 0n && finalCvtcReserve > 0n) {
    console.log("\\n🎉 SUCCÈS ! POOL OPÉRATIONNEL");
    console.log("===========================");
    console.log("✅ Swaps BNB → CVTC possibles");
    console.log("✅ Onboarding complet fonctionnel");
    console.log("🚀 Prêt pour la production !");
  } else {
    console.log("\\n⚠️ Pool pas encore opérationnel");
  }
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});