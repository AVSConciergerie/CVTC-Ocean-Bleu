const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log('🚀 DÉPLOIEMENT STANDALONE - CVTC OCEAN BLEU');
  console.log('='.repeat(60));

  // Configuration
  const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL || 'https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7');
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.log('❌ PRIVATE_KEY manquante dans .env');
    return;
  }

  const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`📤 Déployeur: ${wallet.address}`);

  try {
    // Vérification du solde
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Solde: ${ethers.formatEther(balance)} BNB`);

    if (balance < ethers.parseEther('0.01')) {
      console.log('⚠️  Solde insuffisant pour le déploiement');
      return;
    }

    // 1. Déploiement CVTCSwap
    console.log('\n📄 Déploiement CVTCSwap...');
    const cvtcAddress = process.env.CVTC_ADDRESS || '0x0000000000000000000000000000000000000000';

    // TEST: Afficher les adresses
    console.log('\n🧪 Test des adresses:');
    console.log(`CVTC_ADDRESS: ${cvtcAddress}`);

    // Charger le bytecode et ABI depuis artifacts
    const fs = require('fs');
    const path = require('path');

    const cvtcSwapArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, '../artifacts/contracts/CVTCSwap.sol/CVTCSwap.json'), 'utf8'));
    const cvtcSwapFactory = new ethers.ContractFactory(cvtcSwapArtifact.abi, cvtcSwapArtifact.bytecode, wallet);

    const cvtcSwap = await cvtcSwapFactory.deploy(cvtcAddress);
    await cvtcSwap.waitForDeployment();
    console.log(`✅ CVTCSwap déployé: ${await cvtcSwap.getAddress()}`);

    // 2. Déploiement Lock
    console.log('\n🔒 Déploiement Lock...');
    const lockArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, '../artifacts/contracts/Lock.sol/Lock.json'), 'utf8'));
    const lockFactory = new ethers.ContractFactory(lockArtifact.abi, lockArtifact.bytecode, wallet);

    const unlockTime = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 an
    const lock = await lockFactory.deploy(unlockTime);
    await lock.waitForDeployment();
    console.log(`✅ Lock déployé: ${await lock.getAddress()}`);

    // 3. Déploiement CVTCCompounder
    console.log('\n⚡ Déploiement CVTCCompounder...');
    const compounderArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, '../artifacts/contracts/CVTCCompounder.sol/CVTCCompounder.json'), 'utf8'));
    const compounderFactory = new ethers.ContractFactory(compounderArtifact.abi, compounderArtifact.bytecode, wallet);

    const farmAddress = process.env.FARM_ADDRESS || '0x0000000000000000000000000000000000000000';
    const routerAddress = process.env.ROUTER_ADDRESS || '0x0000000000000000000000000000000000000000';
    const rewardTokenAddress = process.env.REWARD_TOKEN_ADDRESS || cvtcAddress;
    const lpTokenAddress = process.env.LP_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';
    const wbnbAddress = process.env.WBNB_ADDRESS || '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd';

    const cvtcCompounder = await compounderFactory.deploy(
      farmAddress,
      routerAddress,
      rewardTokenAddress,
      lpTokenAddress,
      cvtcAddress,
      wbnbAddress,
      await cvtcSwap.getAddress()
    );
    await cvtcCompounder.waitForDeployment();
    console.log(`✅ CVTCCompounder déployé: ${await cvtcCompounder.getAddress()}`);

    // 4. Déploiement CVTCPremium
    console.log('\n👑 Déploiement CVTCPremium...');
    const premiumArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, '../artifacts/contracts/CVTCPremium.sol/CVTCPremium.json'), 'utf8'));
    const premiumFactory = new ethers.ContractFactory(premiumArtifact.abi, premiumArtifact.bytecode, wallet);

    const cvtcPremium = await premiumFactory.deploy(cvtcAddress, await cvtcSwap.getAddress());
    await cvtcPremium.waitForDeployment();
    console.log(`✅ CVTCPremium déployé: ${await cvtcPremium.getAddress()}`);

    // Sauvegarde des adresses
    const deploymentInfo = {
      network: 'bscTestnet',
      timestamp: new Date().toISOString(),
      deployer: wallet.address,
      contracts: {
        CVTCSwap: await cvtcSwap.getAddress(),
        Lock: await lock.getAddress(),
        CVTCCompounder: await cvtcCompounder.getAddress(),
        CVTCPremium: await cvtcPremium.getAddress()
      }
    };

    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir);
    }

    const deploymentFile = path.join(deploymentsDir, `deployment-standalone-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Déploiement sauvegardé: ${deploymentFile}`);

    // Mise à jour du .env
    const envContent = `
# Adresses des contrats déployés - BSC Testnet
CVTC_SWAP_ADDRESS=${await cvtcSwap.getAddress()}
LOCK_ADDRESS=${await lock.getAddress()}
CVTC_COMPOUNDER_ADDRESS=${await cvtcCompounder.getAddress()}
CVTC_PREMIUM_ADDRESS=${await cvtcPremium.getAddress()}
`;

    const envFile = path.join(__dirname, '../.env');
    if (fs.existsSync(envFile)) {
      const existingEnv = fs.readFileSync(envFile, 'utf8');
      fs.writeFileSync(envFile, existingEnv + envContent);
    } else {
      fs.writeFileSync(envFile, envContent);
    }
    console.log('📄 Variables d\'environnement mises à jour');

    console.log('\n🎉 DÉPLOIEMENT TERMINÉ !');
    console.log('📋 Adresses des contrats:');
    console.log(`   CVTCSwap: ${await cvtcSwap.getAddress()}`);
    console.log(`   Lock: ${await lock.getAddress()}`);
    console.log(`   CVTCCompounder: ${await cvtcCompounder.getAddress()}`);
    console.log(`   CVTCPremium: ${await cvtcPremium.getAddress()}`);

    // Vérification BSCScan
    console.log('\n🔍 Vérifier sur BSCScan:');
    console.log(`   https://testnet.bscscan.com/address/${await cvtcSwap.getAddress()}`);
    console.log(`   https://testnet.bscscan.com/address/${await lock.getAddress()}`);
    console.log(`   https://testnet.bscscan.com/address/${await cvtcCompounder.getAddress()}`);
    console.log(`   https://testnet.bscscan.com/address/${await cvtcPremium.getAddress()}`);

  } catch (error) {
    console.log('❌ Erreur de déploiement:', error?.message || 'Erreur inconnue');
  }
}

main().catch((error) => {
  console.error('❌ Erreur critique:', error);
  process.exitCode = 1;
});
