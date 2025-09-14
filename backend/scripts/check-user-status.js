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

// ABI pour vérifier le statut
const onboardingABI = [
    "function getUserOnboardingStatus(address user) external view returns (bool,bool,uint256,uint256,uint8,uint256)"
];

// Adresse de l'utilisateur
const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

async function checkUserStatus() {
    console.log('🔍 VÉRIFICATION DU STATUT UTILISATEUR');
    console.log('=====================================');

    try {
        const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
        const contract = new ethers.Contract(ONBOARDING_CONTRACT_ADDRESS, onboardingABI, provider);

        console.log(`👤 Utilisateur: ${USER_ADDRESS}`);
        console.log(`📍 Contrat: ${ONBOARDING_CONTRACT_ADDRESS}`);
        console.log('');

        const status = await contract.getUserOnboardingStatus(USER_ADDRESS);
        const [isActive, completed, daysRemaining, cvtcAccumulated, currentPalier, totalRepaid] = status;

        console.log('📊 STATUT DANS LE CONTRAT:');
        console.log(`   Actif: ${isActive}`);
        console.log(`   Terminé: ${completed}`);
        console.log(`   Jours restants: ${daysRemaining}`);
        console.log(`   CVTC accumulés: ${ethers.formatEther(cvtcAccumulated)} CVTC`);
        console.log(`   Palier actuel: ${currentPalier}`);
        console.log(`   Total remboursé: ${ethers.formatEther(totalRepaid)} BNB`);
        console.log('');

        if (!isActive) {
            console.log('❌ L\'utilisateur n\'est pas actif dans le contrat');
            console.log('💡 Causes possibles:');
            console.log('   - Onboarding terminé (30 jours écoulés)');
            console.log('   - Tous les paliers de remboursement atteints');
            console.log('   - Utilisateur désactivé manuellement');
        } else if (completed) {
            console.log('🏁 L\'onboarding est terminé');
            console.log('💡 L\'utilisateur a complété le processus de 30 jours');
        } else {
            console.log('✅ L\'utilisateur peut recevoir des swaps quotidiens');
        }

    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error.message);
    }
}

// Exécuter la vérification
checkUserStatus().catch(console.error);