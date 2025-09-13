import { ethers } from "hardhat";

async function main() {
  console.log("🔄 DÉPLOIEMENT CONTRAT SWAP CORRIGÉ");
  console.log("===================================");

  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // Étape 1: Déployer le contrat corrigé
  console.log("\\n📦 ÉTAPE 1: DÉPLOIEMENT CVTCSwap CORRIGÉ...");
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

  // Étape 4: Transférer les CVTC depuis l'adresse spéciale
  console.log("\\n🪙 ÉTAPE 4: TRANSFERT CVTC DEPUIS ADRESSE SPÉCIALE...");

  // Cette étape doit être faite manuellement par l'adresse spéciale
  console.log("⚠️ TRANSFERT CVTC À FAIRE MANUELLEMENT:");
  console.log(`📤 De: 0xFC62525a23197922002F30863Ef7B2d91B6576D0`);
  console.log(`📍 Vers: ${swapAddress}`);
  console.log(`💰 Montant: 2,500,000,000 CVTC (250000000000 en unités)`);
  console.log(`🌐 BSCScan: https://testnet.bscscan.com/address/0x532FC49071656C16311F2f89E6e41C53243355D3#writeContract`);

  // Étape 5: Vérification
  console.log("\\n🔍 ÉTAPE 5: VÉRIFICATION...");
  const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
  const contractBnbBalance = await ethers.provider.getBalance(swapAddress);

  console.log(`💰 BNB dans contrat: ${ethers.formatEther(contractBnbBalance)} BNB`);
  console.log(`💰 BNB réserve: ${ethers.formatEther(bnbReserve)} BNB`);
  console.log(`🪙 CVTC réserve: ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);

  console.log("\\n🎉 CONTRAT CORRIGÉ DÉPLOYÉ!");
  console.log("===========================");

  console.log("\\n📋 PROCHAINES ÉTAPES:");
  console.log("====================");
  console.log("1. ✅ Transférer 2.5B CVTC depuis adresse spéciale");
  console.log("2. ✅ Ajuster les réserves du contrat");
  console.log("3. ✅ Mettre à jour backend avec nouvelle adresse");
  console.log("4. ✅ Tester swap pour utilisateur");
  console.log(`\\n🆕 Nouvelle adresse contrat: ${swapAddress}`);

  console.log("\\n⚡ NOUVELLE FONCTION DISPONIBLE:");
  console.log("================================");
  console.log("buyForUser(address user, uint256 minCvtcOut)");
  console.log("- Permet à l'owner de faire un swap pour un utilisateur spécifique");
  console.log("- Les tokens vont directement à l'utilisateur");
  console.log("- Corrige le problème précédent");
}

main().catch(console.error);