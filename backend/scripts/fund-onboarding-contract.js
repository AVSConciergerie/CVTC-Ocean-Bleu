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

async function fundOnboardingContract() {
    console.log('💰 ALIMENTATION DU CONTRAT ONBOARDING');
    console.log('====================================');

    try {
        const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
        const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);

        console.log(`👑 Opérateur: ${operatorWallet.address}`);
        console.log(`📍 Contrat: ${ONBOARDING_CONTRACT_ADDRESS}`);
        console.log('');

        // Vérifier le solde actuel de l'opérateur
        const balance = await provider.getBalance(operatorWallet.address);
        console.log(`💰 Solde opérateur: ${ethers.formatEther(balance)} BNB`);

        // Vérifier le solde actuel du contrat
        const contractBalance = await provider.getBalance(ONBOARDING_CONTRACT_ADDRESS);
        console.log(`💰 Solde contrat: ${ethers.formatEther(contractBalance)} BNB`);

        // Calculer le montant nécessaire (pour swaps quotidiens)
        const amountNeeded = ethers.parseEther("0.1"); // Assez pour plusieurs swaps
        console.log(`🎯 Montant à envoyer: ${ethers.formatEther(amountNeeded)} BNB`);

        if (balance < amountNeeded) {
            console.log(`❌ Solde insuffisant: ${ethers.formatEther(amountNeeded)} BNB requis`);
            return;
        }

        console.log('📤 Envoi des fonds...');

        // Envoyer les fonds au contrat
        const tx = await operatorWallet.sendTransaction({
            to: ONBOARDING_CONTRACT_ADDRESS,
            value: amountNeeded,
            gasLimit: 21000
        });

        console.log(`📤 Transaction envoyée: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log('✅ Transaction confirmée!');
        console.log(`📊 Gas utilisé: ${receipt.gasUsed}`);

        // Vérifier le nouveau solde du contrat
        const newContractBalance = await provider.getBalance(ONBOARDING_CONTRACT_ADDRESS);
        console.log(`💰 Nouveau solde contrat: ${ethers.formatEther(newContractBalance)} BNB`);

        if (newContractBalance >= ethers.parseEther("0.3")) {
            console.log('');
            console.log('🎉 SUCCÈS! Le contrat a maintenant les fonds nécessaires');
            console.log('✅ Les utilisateurs peuvent maintenant s\'inscrire');
            console.log('');
            console.log('🔗 TRANSACTION D\'ALIMENTATION:');
            console.log(`https://testnet.bscscan.com/tx/${tx.hash}`);
        } else {
            console.log('');
            console.log('❌ ÉCHEC: Le contrat n\'a pas reçu les fonds');
        }

    } catch (error) {
        console.error('❌ Erreur lors de l\'alimentation:', error.message);
    }
}

// Exécuter l'alimentation
fundOnboardingContract().catch(console.error);