import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const {
    BNB_RPC_URL,
    OPERATOR_PRIVATE_KEY
} = process.env;

// Adresse du contrat onboarding
const ONBOARDING_CONTRACT_ADDRESS = "0xf3af730B6eaF257EC44b244d56F3073Fd6B593c5";

async function testContractReceive() {
    console.log('🧪 TEST DE RÉCEPTION BNB PAR LE CONTRAT');
    console.log('=====================================');

    try {
        const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
        const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);

        console.log(`👑 Opérateur: ${operatorWallet.address}`);
        console.log(`📍 Contrat: ${ONBOARDING_CONTRACT_ADDRESS}`);
        console.log('');

        // Vérifier le solde actuel du contrat
        const contractBalanceBefore = await provider.getBalance(ONBOARDING_CONTRACT_ADDRESS);
        console.log(`💰 Solde contrat avant: ${ethers.formatEther(contractBalanceBefore)} BNB`);

        // Tester avec un petit montant
        const testAmount = ethers.parseEther("0.001"); // Très petit montant pour test
        console.log(`🎯 Montant de test: ${ethers.formatEther(testAmount)} BNB`);

        // Vérifier que l'opérateur a assez
        const operatorBalance = await provider.getBalance(operatorWallet.address);
        if (operatorBalance < testAmount) {
            console.log('❌ Solde opérateur insuffisant');
            return;
        }

        console.log('📤 Tentative d\'envoi...');

        // Essayer d'envoyer directement au contrat
        try {
            const tx = await operatorWallet.sendTransaction({
                to: ONBOARDING_CONTRACT_ADDRESS,
                value: testAmount,
                gasLimit: 50000 // Augmenter le gas limit
            });

            console.log(`📤 Transaction: ${tx.hash}`);
            const receipt = await tx.wait();

            console.log(`✅ Statut: ${receipt.status}`);
            console.log(`📊 Gas utilisé: ${receipt.gasUsed}`);

            if (receipt.status === 1) {
                const contractBalanceAfter = await provider.getBalance(ONBOARDING_CONTRACT_ADDRESS);
                console.log(`💰 Solde contrat après: ${ethers.formatEther(contractBalanceAfter)} BNB`);

                const received = contractBalanceAfter - contractBalanceBefore;
                console.log(`📈 Reçu par le contrat: ${ethers.formatEther(received)} BNB`);

                if (received >= testAmount) {
                    console.log('🎉 SUCCÈS! Le contrat peut recevoir des BNB');
                } else {
                    console.log('⚠️ Le contrat n\'a pas reçu le montant attendu');
                }
            } else {
                console.log('❌ Transaction échouée');
            }

        } catch (error) {
            console.log('❌ Erreur lors de l\'envoi:', error.message);

            // Analyser l'erreur plus en détail
            if (error.message.includes('revert')) {
                console.log('💡 La transaction a été revert - le contrat rejette les transferts');
            } else if (error.message.includes('insufficient funds')) {
                console.log('💡 Fonds insuffisants');
            } else {
                console.log('💡 Erreur inconnue');
            }
        }

    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

// Exécuter le test
testContractReceive().catch(console.error);