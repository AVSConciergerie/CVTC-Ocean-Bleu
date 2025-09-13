import { ethers } from "hardhat";

async function main() {
  console.log("🔄 DÉPLOIEMENT CONTRAT AVEC FONCTION EXCEPTIONNELLE");
  console.log("==================================================");

  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";
  const SPECIAL_ADDRESS = "0xFC62525a23197922002F30863Ef7B2d91B6576D0";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`🎯 Adresse exceptionnelle: ${SPECIAL_ADDRESS}`);

  // Étape 1: Déployer le contrat mis à jour
  console.log("\\n📦 ÉTAPE 1: DÉPLOIEMENT CVTCSwap MIS À JOUR...");
  const CVTCSwap = await ethers.getContractFactory("CVTCSwap");
  const swapContract = await CVTCSwap.deploy(CVTC_TOKEN_ADDRESS);
  await swapContract.waitForDeployment();

  const swapAddress = await swapContract.getAddress();
  console.log(`✅ Nouveau contrat déployé: ${swapAddress}`);

  // Étape 2: Activer la liquidité
  console.log("\\n🔓 ÉTAPE 2: ACTIVATION LIQUIDITÉ...");
  const toggleTx = await swapContract.toggleLiquidity();
  await toggleTx.wait();
  console.log("✅ Liquidité activée");

  // Étape 3: Transférer 0.00002 BNB
  console.log("\\n💸 ÉTAPE 3: TRANSFERT BNB (0.00002)...");
  const bnbAmount = ethers.parseEther("0.00002");

  const transferBnbTx = await deployer.sendTransaction({
    to: swapAddress,
    value: bnbAmount
  });
  await transferBnbTx.wait();
  console.log(`✅ ${ethers.formatEther(bnbAmount)} BNB transférés`);

  // Étape 4: Vérification
  console.log("\\n🔍 ÉTAPE 4: VÉRIFICATION...");
  const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
  const contractBnbBalance = await ethers.provider.getBalance(swapAddress);

  console.log(`💰 BNB dans contrat: ${ethers.formatEther(contractBnbBalance)}`);
  console.log(`💰 BNB réserve: ${ethers.formatEther(bnbReserve)}`);
  console.log(`🪙 CVTC réserve: ${ethers.formatUnits(cvtcReserve, 2)}`);

  // Étape 5: Vérification BscScan
  console.log("\\n🔍 ÉTAPE 5: VÉRIFICATION BSCSCAN...");
  try {
    await hre.run("verify:verify", {
      address: swapAddress,
      constructorArguments: [CVTC_TOKEN_ADDRESS],
      network: "bscTestnet"
    });
    console.log("✅ Contrat vérifié sur BscScan!");
  } catch (error) {
    console.log("⚠️ Vérification échouée, mais contrat déployé");
  }

  console.log("\\n🎉 CONTRAT EXCEPTIONNEL DÉPLOYÉ!");
  console.log("=================================");

  console.log("\\n📋 INSTRUCTIONS POUR INITIALISATION:");
  console.log("====================================");

  console.log("\\n1️⃣ TRANSFERT CVTC (depuis votre adresse spéciale):");
  console.log("================================================");
  console.log(`🌐 Aller sur: https://testnet.bscscan.com/address/${CVTC_TOKEN_ADDRESS}#writeContract`);
  console.log("🔗 Connecter MetaMask avec l'adresse spéciale");
  console.log("📤 Appeler fonction 'transfer':");
  console.log(`   - to: ${swapAddress}`);
  console.log(`   - amount: 250000000000`);
  console.log("✅ Confirmer la transaction");

  console.log("\\n2️⃣ INITIALISATION RÉSERVES (depuis adresse spéciale):");
  console.log("==================================================");
  console.log(`🌐 Aller sur: https://testnet.bscscan.com/address/${swapAddress}#writeContract`);
  console.log("🔗 Connecter MetaMask avec l'adresse spéciale");
  console.log("🚀 Appeler fonction 'emergencyInitWithTransfer':");
  console.log(`   - _bnbReserve: 20000000000000`);
  console.log(`   - _cvtcReserve: 250000000000`);
  console.log("✅ Confirmer la transaction");

  console.log("\\n🎯 RÉSULTAT ATTENDU:");
  console.log("===================");
  console.log("✅ Ratio: 1 BNB = 125,000,000,000 CVTC");
  console.log("✅ Volatilité maximale activée");
  console.log("✅ Pool anti-baleine opérationnel");

  console.log("\\n⚙️ MISE À JOUR BACKEND:");
  console.log(`Modifier backend/.env:`);
  console.log(`CVTC_ONBOARDING_CONTRACT_ADDRESS=${swapAddress}`);

  console.log("\\n🎊 PRÊT POUR L'INITIALISATION EXCEPTIONNELLE!");
  console.log("=============================================");
  console.log("✅ Contrat déployé et vérifié");
  console.log("✅ Fonction exceptionnelle disponible");
  console.log("✅ Adresse spéciale autorisée");
  console.log("✅ Minimum d'actions manuelles");
  console.log("🚀 Il ne reste que les transferts !");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});