import { ethers } from "hardhat";

async function main() {
    console.log("🔄 REDEPLOIEMENT PAYMASTER CORRIGÉ");
    console.log("==================================");

    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);

    // Adresses des contrats
    const ENTRY_POINT = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
    const CVTC_TOKEN = "0x532FC49071656C16311F2f89E6e41C53243355D3";
    const CVTC_SWAP = "0x9fD15619a90005468F02920Bb569c95759Da710C";

    // Déploiement du contrat corrigé
    console.log("🔨 Déploiement CVTCPaymaster...");
    const PaymasterFactory = await ethers.getContractFactory("CVTCPaymaster");
    const paymaster = await PaymasterFactory.deploy(
        ENTRY_POINT,
        CVTC_TOKEN,
        CVTC_SWAP
    );

    await paymaster.waitForDeployment();
    const paymasterAddress = await paymaster.getAddress();

    console.log(`✅ Paymaster déployé: ${paymasterAddress}`);

    // Configuration du prix CVTC
    console.log("\\n💰 Configuration prix CVTC...");
    const cvtcPrice = BigInt("1000000000000"); // 1e12 = 0.000001 ETH
    await paymaster.updateTokenPrice(CVTC_TOKEN, cvtcPrice);
    console.log(`✅ Prix CVTC configuré: ${ethers.formatEther(cvtcPrice)} ETH`);

    // Vérification
    const configuredPrice = await paymaster.tokenPrices(CVTC_TOKEN);
    console.log(`🔍 Prix vérifié: ${ethers.formatEther(configuredPrice)} ETH`);

    // Test rapide
    const testQuote = await paymaster.getTokenQuote(CVTC_TOKEN, 100000);
    console.log(`\\n🧪 Test quote:`);
    console.log(`   Gas limit: 100,000`);
    console.log(`   CVTC requis: ${ethers.formatUnits(testQuote, 2)} CVTC`);
    console.log(`   Quote brute: ${testQuote.toString()}`);

    console.log(`\\n🎉 Paymaster corrigé déployé et configuré !`);
    console.log(`📋 Nouvelle adresse: ${paymasterAddress}`);
}

main().catch(console.error);