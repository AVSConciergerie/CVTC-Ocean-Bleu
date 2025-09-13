import fetch from 'node-fetch';
import { ethers } from 'ethers';

const BACKEND_URL = 'http://localhost:4000';
const CVTC_TOKEN_ADDRESS = '0x532FC49071656C16311F2f89E6e41C53243355D3';

/**
 * Test script pour vérifier le fallback backend paymaster
 */
async function testPaymasterFallback() {
    console.log('🧪 Test du système de fallback paymaster backend...\n');

    try {
        // Test 1: Vérifier le statut du paymaster
        console.log('1️⃣ Test du statut paymaster...');
        const statusResponse = await fetch(`${BACKEND_URL}/api/paymaster/status`);
        const statusData = await statusResponse.json();

        if (statusData.success) {
            console.log('✅ Statut paymaster OK:');
            console.log('   - Paymaster:', statusData.data.paymasterAddress);
            console.log('   - CVTC supporté:', statusData.data.cvtcSupported);
            console.log('   - Test data réussi:', statusData.data.testDataSuccessful);
        } else {
            console.log('❌ Erreur statut paymaster:', statusData.error);
            return;
        }

        // Test 2: Récupérer les données paymaster
        console.log('\n2️⃣ Test récupération données paymaster...');
        const dataResponse = await fetch(`${BACKEND_URL}/api/paymaster/data/${CVTC_TOKEN_ADDRESS}`);
        const dataResult = await dataResponse.json();

        if (dataResult.success) {
            console.log('✅ Données paymaster récupérées:');
            console.log('   - Longueur:', dataResult.data.paymasterData.length);
            console.log('   - Format hex valide:', dataResult.data.paymasterData.startsWith('0x'));

            // Vérifier que c'est des bytes valides
            try {
                const bytes = ethers.getBytes(dataResult.data.paymasterData);
                console.log('   - Conversion bytes réussie, longueur:', bytes.length);
            } catch (error) {
                console.log('❌ Erreur conversion bytes:', error.message);
            }
        } else {
            console.log('❌ Erreur données paymaster:', dataResult.error);
            return;
        }

        // Test 3: Récupérer les données stub
        console.log('\n3️⃣ Test récupération données stub...');
        const stubResponse = await fetch(`${BACKEND_URL}/api/paymaster/stub/${CVTC_TOKEN_ADDRESS}`);
        const stubResult = await stubResponse.json();

        if (stubResult.success) {
            console.log('✅ Données stub récupérées:');
            console.log('   - Longueur:', stubResult.data.paymasterStubData.length);
            console.log('   - Format hex valide:', stubResult.data.paymasterStubData.startsWith('0x'));
        } else {
            console.log('❌ Erreur données stub:', stubResult.error);
            return;
        }

        // Test 4: Calculer une quote
        console.log('\n4️⃣ Test calcul quote (100000 gas)...');
        const quoteResponse = await fetch(`${BACKEND_URL}/api/paymaster/quote/100000/${CVTC_TOKEN_ADDRESS}`);
        const quoteResult = await quoteResponse.json();

        if (quoteResult.success) {
            console.log('✅ Quote calculée:');
            console.log('   - Gas limit:', quoteResult.data.gasLimit);
            console.log('   - Montant tokens:', quoteResult.data.tokenAmount, 'CVTC');
            console.log('   - Quote brute:', quoteResult.data.quote);
        } else {
            console.log('❌ Erreur calcul quote:', quoteResult.error);
            return;
        }

        console.log('\n🎉 Tous les tests du fallback backend ont réussi !');
        console.log('💡 Le système de fallback est opérationnel.');

    } catch (error) {
        console.error('❌ Erreur lors des tests:', error.message);
        console.log('\n🔧 Assurez-vous que:');
        console.log('   - Le serveur backend est démarré (npm start dans /backend)');
        console.log('   - Le contrat paymaster est déployé et accessible');
        console.log('   - La configuration réseau est correcte');
    }
}

// Exécuter les tests
testPaymasterFallback();