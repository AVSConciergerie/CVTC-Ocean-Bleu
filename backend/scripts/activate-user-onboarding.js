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

// Adresse de l'utilisateur
const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

async function activateUserOnboarding() {
    console.log('🎯 ACTIVATION UTILISATEUR DANS ONBOARDING');
    console.log('======================================');

    try {
        const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
        const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);

        console.log(`👤 Utilisateur: ${USER_ADDRESS}`);
        console.log(`👑 Opérateur: ${operatorWallet.address}`);
        console.log(`📍 Contrat: ${ONBOARDING_CONTRACT_ADDRESS}`);
        console.log('');

        // Vérifier le solde de l'opérateur
        const balance = await provider.getBalance(operatorWallet.address);
        console.log(`💰 Solde opérateur: ${ethers.formatEther(balance)} BNB`);

        // Vérifier le solde du contrat
        const contractBalance = await provider.getBalance(ONBOARDING_CONTRACT_ADDRESS);
        console.log(`💰 Solde contrat: ${ethers.formatEther(contractBalance)} BNB`);

        // Créer un wallet temporaire pour l'utilisateur
        const userWallet = ethers.Wallet.createRandom().connect(provider);

        // Alimenter le wallet temporaire avec 0.01 BNB (coût estimé de la transaction)
        console.log('💸 Alimentation du wallet utilisateur...');
        const fundTx = await operatorWallet.sendTransaction({
            to: userWallet.address,
            value: ethers.parseEther("0.01")
        });
        await fundTx.wait();
        console.log(`✅ Wallet alimenté: ${fundTx.hash}`);
        console.log('');

        // ABI pour acceptOnboardingTerms
        const onboardingABI = [
            "function acceptOnboardingTerms() external",
            "function getUserOnboardingStatus(address user) external view returns (bool,bool,uint256,uint256,uint8,uint256)"
        ];

        // Contrat connecté avec le wallet de l'utilisateur
        const contract = new ethers.Contract(ONBOARDING_CONTRACT_ADDRESS, onboardingABI, userWallet);

        console.log('📝 Appel de acceptOnboardingTerms()...');

        // Appeler acceptOnboardingTerms
        const tx = await contract.acceptOnboardingTerms({
            gasLimit: 500000
        });

        console.log(`📤 Transaction envoyée: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log('✅ Transaction confirmée!');
        console.log(`📊 Gas utilisé: ${receipt.gasUsed}`);
        console.log('');

        // Vérifier le nouveau statut
        console.log('🔍 Vérification du statut après activation...');
        const statusContract = new ethers.Contract(ONBOARDING_CONTRACT_ADDRESS, onboardingABI, provider);
        const status = await statusContract.getUserOnboardingStatus(USER_ADDRESS);
        const [isActive, completed, daysRemaining, cvtcAccumulated, currentPalier, totalRepaid] = status;

        console.log('📊 NOUVEAU STATUT:');
        console.log(`   Actif: ${isActive}`);
        console.log(`   Terminé: ${completed}`);
        console.log(`   Jours restants: ${daysRemaining}`);
        console.log(`   CVTC accumulés: ${ethers.formatEther(cvtcAccumulated)} CVTC`);
        console.log(`   Palier actuel: ${currentPalier}`);
        console.log('');

        if (isActive) {
            console.log('🎉 SUCCÈS! L\'utilisateur est maintenant actif!');
            console.log('✅ Les swaps quotidiens peuvent maintenant être exécutés');
            console.log('');
            console.log('🔗 TRANSACTION D\'ACTIVATION:');
            console.log(`https://testnet.bscscan.com/tx/${tx.hash}`);
        } else {
            console.log('❌ ÉCHEC: L\'utilisateur n\'a pas été activé');
            console.log('💡 Vérifier les logs de la transaction pour plus de détails');
        }

    } catch (error) {
        console.error('❌ Erreur lors de l\'activation:', error.message);

        if (error.message.includes("Already active")) {
            console.log('ℹ️ L\'utilisateur est déjà actif');
        } else if (error.message.includes("Already completed")) {
            console.log('ℹ️ L\'onboarding est déjà terminé');
        } else if (error.message.includes("insufficient funds")) {
            console.log('💰 Fonds insuffisants pour la transaction');
        }
    }
}

// Exécuter l'activation
activateUserOnboarding().catch(console.error);