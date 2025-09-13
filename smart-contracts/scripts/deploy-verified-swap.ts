import { ethers } from "hardhat";

async function main() {
  console.log("🔄 DÉPLOIEMENT CONTRAT VÉRIFIÉ");
  console.log("=============================");

  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // Étape 1: Déployer le contrat
  console.log("\\n📦 ÉTAPE 1: Déploiement CVTCSwap...");
  const CVTCSwap = await ethers.getContractFactory("CVTCSwap");
  const swapContract = await CVTCSwap.deploy(CVTC_TOKEN_ADDRESS);
  await swapContract.waitForDeployment();

  const swapAddress = await swapContract.getAddress();
  console.log(`✅ Contrat déployé: ${swapAddress}`);

  // Étape 2: Activer la liquidité
  console.log("\\n🔓 ÉTAPE 2: Activation liquidité...");
  const toggleTx = await swapContract.toggleLiquidity();
  await toggleTx.wait();
  console.log("✅ Liquidité activée");

  // Étape 3: Mint des tokens CVTC dans le contrat
  console.log("\\n🪙 ÉTAPE 3: Mint CVTC dans le contrat...");
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);
  const mintAmount = ethers.parseUnits("2500000000", 2); // 2.5 milliards

  try {
    const mintTx = await cvtcToken.mint(swapAddress, mintAmount);
    await mintTx.wait();
    console.log(`✅ ${ethers.formatUnits(mintAmount, 2)} CVTC mintés`);
  } catch (error) {
    console.log("❌ Mint impossible, utilisation alternative...");
    console.log("💡 Le contrat devra être initialisé manuellement");
  }

  // Étape 4: Transférer 0.00002 BNB
  console.log("\\n💸 ÉTAPE 4: Transfert 0.00002 BNB...");
  const bnbAmount = ethers.parseEther("0.00002");

  const transferTx = await deployer.sendTransaction({
    to: swapAddress,
    value: bnbAmount
  });
  await transferTx.wait();
  console.log(`✅ ${ethers.formatEther(bnbAmount)} BNB transférés`);

  // Étape 5: Vérification du contrat
  console.log("\\n🔍 ÉTAPE 5: Vérification sur BSCScan...");
  try {
    await hre.run("verify:verify", {
      address: swapAddress,
      constructorArguments: [CVTC_TOKEN_ADDRESS],
      network: "bscTestnet"
    });
    console.log("✅ Contrat vérifié sur BSCScan!");
  } catch (error) {
    console.log("⚠️ Vérification échouée, mais contrat déployé");
    console.log("💡 Vous pouvez vérifier manuellement sur BSCScan");
  }

  // Vérification finale
  const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
  const contractCvtcBalance = await cvtcToken.balanceOf(swapAddress);
  const contractBnbBalance = await ethers.provider.getBalance(swapAddress);

  console.log("\\n🎯 ÉTAT FINAL:");
  console.log(`📍 Adresse: ${swapAddress}`);
  console.log(`💰 BNB dans contrat: ${ethers.formatEther(contractBnbBalance)}`);
  console.log(`🪙 CVTC dans contrat: ${ethers.formatUnits(contractCvtcBalance, 2)}`);
  console.log(`💰 BNB réserve: ${ethers.formatEther(bnbReserve)}`);
  console.log(`🪙 CVTC réserve: ${ethers.formatUnits(cvtcReserve, 2)}`);

  // Calcul du ratio
  if (contractBnbBalance > 0n && contractCvtcBalance > 0n) {
    const ratio = Number(ethers.formatUnits(contractCvtcBalance, 2)) / Number(ethers.formatEther(contractBnbBalance));
    console.log(`📈 Ratio: 1 BNB = ${ratio.toLocaleString()} CVTC`);
  }

  console.log("\\n🚀 PROCHAINES ÉTAPES:");
  console.log("====================");
  console.log("1. Vérifier le contrat sur BSCScan si pas déjà fait");
  console.log("2. Aller dans l'onglet 'Write Contract'");
  console.log("3. Appeler emergencyInitialize() ou emergencySetReserves()");
  console.log("4. Tester l'onboarding");

  console.log("\\n⚙️ MISE À JOUR BACKEND:");
  console.log(`Modifier backend/.env:`);
  console.log(`CVTC_ONBOARDING_CONTRACT_ADDRESS=${swapAddress}`);

  console.log("\\n🎉 NOUVEAU CONTRAT PRÊT!");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});