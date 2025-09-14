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

// ABI pour réactiver l'utilisateur
const onboardingABI = [
    "function acceptOnboardingTerms() external",
    "function getUserOnboardingStatus(address user) external view returns (bool,bool,uint256,uint256,uint8,uint256)",
    "function setAuthorizedOperator(address operator, bool status) external"
];

// Adresse de l'utilisateur
const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

async function reactivateUser() {
    console.log('🔄 RÉACTIVATION DE L\'UTILISATEUR');
    console.log('===============================');

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

        if (balance < ethers.parseEther("0.5")) {
            console.log('❌ Solde insuffisant pour réactiver l\'utilisateur');
            console.log('💡 L\'opérateur doit avoir au moins 0.5 BNB');
            return;
        }

        // Créer le contrat avec le wallet de l'utilisateur (pour acceptOnboardingTerms)
        const userWallet = new ethers.Wallet.createRandom().connect(provider);
        // Alimenter le wallet temporaire de l'utilisateur
        const fundTx = await operatorWallet.sendTransaction({
            to: userWallet.address,
            value: ethers.parseEther("0.1")
        });
        await fundTx.wait();
        console.log('✅ Wallet utilisateur temporaire créé et alimenté');

        const contract = new ethers.Contract(ONBOARDING_CONTRACT_ADDRESS, onboardingABI, userWallet);

        console.log('📝 Réactivation en cours...');

        // Appeler acceptOnboardingTerms pour réactiver
        const tx = await contract.acceptOnboardingTerms();
        console.log(`📤 Transaction envoyée: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log('✅ Transaction confirmée!');
        console.log(`📊 Gas utilisé: ${receipt.gasUsed}`);

        // Vérifier le nouveau statut
        console.log('');
        console.log('🔍 Vérification du nouveau statut...');
        const statusContract = new ethers.Contract(ONBOARDING_CONTRACT_ADDRESS, onboardingABI, provider);
        const status = await statusContract.getUserOnboardingStatus(USER_ADDRESS);
        const [isActive, completed, daysRemaining, cvtcAccumulated, currentPalier, totalRepaid] = status;

        console.log('📊 NOUVEAU STATUT:');
        console.log(`   Actif: ${isActive}`);
        console.log(`   Terminé: ${completed}`);
        console.log(`   Jours restants: ${daysRemaining}`);
        console.log(`   CVTC accumulés: ${ethers.formatEther(cvtcAccumulated)} CVTC`);

        if (isActive) {
            console.log('');
            console.log('🎉 Utilisateur réactivé avec succès!');
            console.log('✅ Les swaps quotidiens peuvent maintenant être exécutés');
        } else {
            console.log('');
            console.log('❌ Échec de la réactivation');
        }

    } catch (error) {
        console.error('❌ Erreur lors de la réactivation:', error.message);

        if (error.message.includes("Already active")) {
            console.log('ℹ️ L\'utilisateur est déjà actif');
        } else if (error.message.includes("Already completed")) {
            console.log('ℹ️ L\'onboarding est déjà terminé');
        }
    }
}

// Exécuter la réactivation
reactivateUser().catch(console.error);