import { ethers } from 'ethers';
import PaymasterUtils from './src/services/paymasterUtils.js';

// Configuration BSC Testnet
const BSC_RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545/";
const PAYMASTER_ADDRESS = "0xa5e6b56FF29a7d0b19946DB836E31D88E41CAdE2"; // NOUVEL paymaster corrigé
const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

// ABI Paymaster
const PAYMASTER_ABI = [
    "function getTokenQuote(address token, uint256 gasLimit) view returns (uint256)"
];

async function testPaymasterFix() {
    console.log('🧪 TEST CORRECTION PAYMASTER CVTC');
    console.log('================================');

    const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
    const paymasterContract = new ethers.Contract(PAYMASTER_ADDRESS, PAYMASTER_ABI, provider);

    const paymasterUtils = new PaymasterUtils(paymasterContract, CVTC_TOKEN_ADDRESS);

    try {
        // Test avec un gas limit typique pour un transfert
        const gasLimit = 100000n;
        console.log(`🔍 Test avec gas limit: ${gasLimit}`);

        const result = await paymasterUtils.calculateTokenAmount(gasLimit);
        console.log(`\\n📊 Résultats:`);
        console.log(`   Coût estimé (BNB): ${result.estimatedCost} BNB`);
        console.log(`   Montant CVTC: ${result.tokenAmount} CVTC`);
        console.log(`   Quote brute: ${result.quote.toString()}`);

        // Vérification que le formatage est correct
        const expectedTokenAmount = ethers.formatUnits(result.quote.toString(), 2);
        console.log(`\\n✅ Vérification:`);
        console.log(`   Attendu: ${expectedTokenAmount} CVTC`);
        console.log(`   Obtenu: ${result.tokenAmount} CVTC`);
        console.log(`   Match: ${expectedTokenAmount === result.tokenAmount ? '✅' : '❌'}`);

        if (expectedTokenAmount === result.tokenAmount) {
            console.log(`\\n🎉 CORRECTION RÉUSSIE !`);
            console.log(`Le montant CVTC est maintenant correctement formaté avec 2 décimales !`);
        } else {
            console.log(`\\n❌ Problème persistant`);
        }

    } catch (error) {
        console.error('❌ Erreur test:', error.message);
    }
}

testPaymasterFix().catch(console.error);