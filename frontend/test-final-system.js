import { ethers } from 'ethers';
import PaymasterUtils from './src/services/paymasterUtils.js';

// Configuration BSC Testnet
const BSC_RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545/";
const PAYMASTER_ADDRESS = "0xa5e6b56FF29a7d0b19946DB836E31D88E41CAdE2"; // NOUVEL paymaster corrigé
const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";
const SMART_ACCOUNT = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

// ABI Paymaster
const PAYMASTER_ABI = [
    "function getTokenQuote(address token, uint256 gasLimit) view returns (uint256)",
    "function tokenPrices(address) view returns (uint256)"
];

async function testFinalSystem() {
    console.log('🎯 TEST FINAL SYSTÈME ERC-4337 + PAYMASTER');
    console.log('=========================================');

    const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
    const paymasterContract = new ethers.Contract(PAYMASTER_ADDRESS, PAYMASTER_ABI, provider);

    const paymasterUtils = new PaymasterUtils(paymasterContract, CVTC_TOKEN_ADDRESS);

    try {
        // 1. Vérifier le prix du CVTC
        const cvtcPrice = await paymasterContract.tokenPrices(CVTC_TOKEN_ADDRESS);
        console.log(`💰 Prix CVTC: ${ethers.formatEther(cvtcPrice)} ETH`);
        console.log(`📊 1 CVTC = ${ethers.formatEther(cvtcPrice)} ETH`);

        // 2. Tester différents gas limits
        const testCases = [
            { gasLimit: 50000, description: "Petit transfert" },
            { gasLimit: 100000, description: "Transfert standard" },
            { gasLimit: 200000, description: "Gros transfert" }
        ];

        for (const testCase of testCases) {
            console.log(`\\n🔍 Test: ${testCase.description} (${testCase.gasLimit} gas)`);

            const result = await paymasterUtils.calculateTokenAmount(testCase.gasLimit);
            console.log(`   Coût estimé: ${result.estimatedCost} ETH`);
            console.log(`   CVTC requis: ${result.tokenAmount} CVTC`);
            console.log(`   Quote brute: ${result.quote.toString()}`);
        }

        // 3. Vérifier le solde du smart account
        const cvtcContract = new ethers.Contract(
            CVTC_TOKEN_ADDRESS,
            ['function balanceOf(address) view returns (uint256)'],
            provider
        );

        const balance = await cvtcContract.balanceOf(SMART_ACCOUNT);
        console.log(`\\n🏦 Solde Smart Account: ${ethers.formatUnits(balance, 2)} CVTC`);

        // 4. Test de faisabilité
        const standardGasLimit = 100000;
        const standardResult = await paymasterUtils.calculateTokenAmount(standardGasLimit);
        const requiredCVTC = parseFloat(standardResult.tokenAmount);
        const availableCVTC = parseFloat(ethers.formatUnits(balance, 2));

        console.log(`\\n✅ VÉRIFICATION FINALE:`);
        console.log(`   CVTC requis pour transfert: ${requiredCVTC} CVTC`);
        console.log(`   CVTC disponible: ${availableCVTC} CVTC`);
        console.log(`   Suffisant: ${availableCVTC >= requiredCVTC ? '✅ OUI' : '❌ NON'}`);

        if (availableCVTC >= requiredCVTC) {
            console.log(`\\n🎉 SUCCÈS ! Le système est prêt pour les transferts P2P !`);
            console.log(`💡 Les frais de gas seront automatiquement payés en CVTC.`);
        } else {
            console.log(`\\n❌ Problème: Solde insuffisant`);
        }

    } catch (error) {
        console.error('❌ Erreur test:', error.message);
    }
}

testFinalSystem().catch(console.error);