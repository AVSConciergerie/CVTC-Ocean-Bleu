import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const {
    BNB_RPC_URL,
    OPERATOR_PRIVATE_KEY
} = process.env;

// Adresses des contrats
const ONBOARDING_CONTRACT_ADDRESS = "0xf3af730B6eaF257EC44b244d56F3073Fd6B593c5";
const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

// ABI pour les fonctions nécessaires
const onboardingABI = [
    "function getUserOnboardingStatus(address user) external view returns (bool,bool,uint256,uint256,uint8,uint256)",
    "function _performSwap(address user, uint256 bnbAmount) external",
    "function executeDailySwap(address user) external"
];

async function forceDailySwap() {
    console.log('⚡ FORÇAGE DU SWAP QUOTIDIEN');
    console.log('===========================');

    try {
        const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
        const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);

        const contract = new ethers.Contract(ONBOARDING_CONTRACT_ADDRESS, onboardingABI, operatorWallet);

        console.log(`👤 Utilisateur: ${USER_ADDRESS}`);
        console.log(`👑 Opérateur: ${operatorWallet.address}`);
        console.log(`📍 Contrat: ${ONBOARDING_CONTRACT_ADDRESS}`);
        console.log('');

        // Vérifier le statut de l'utilisateur
        console.log('📊 VÉRIFICATION DU STATUT...');
        const status = await contract.getUserOnboardingStatus(USER_ADDRESS);
        const [isActive, completed, daysRemaining, cvtcAccumulated, currentPalier, totalRepaid] = status;

        console.log(`   Actif: ${isActive}`);
        console.log(`   Terminé: ${completed}`);
        console.log(`   Jours restants: ${daysRemaining}`);
        console.log(`   CVTC accumulés: ${ethers.formatUnits(cvtcAccumulated, 18)} CVTC`);
        console.log('');

        // Vérifier le solde du contrat
        const contractBalance = await provider.getBalance(ONBOARDING_CONTRACT_ADDRESS);
        console.log(`💰 Solde contrat: ${ethers.formatEther(contractBalance)} BNB`);

        const dailyAmount = ethers.parseEther("0.000013"); // 0.000013 BNB
        console.log(`💸 Montant quotidien requis: ${ethers.formatEther(dailyAmount)} BNB`);
        console.log('');

        if (contractBalance < dailyAmount) {
            console.log('❌ Solde insuffisant dans le contrat');
            return;
        }

        // Essayer d'exécuter le swap quotidien normal d'abord
        console.log('🔄 Tentative 1: Swap quotidien normal...');
        try {
            const tx = await contract.executeDailySwap(USER_ADDRESS);
            console.log(`📤 Transaction: ${tx.hash}`);

            const receipt = await tx.wait();
            console.log('✅ Swap quotidien réussi!');
            console.log(`📊 Gas: ${receipt.gasUsed}`);

            // Vérifier le nouveau statut
            const newStatus = await contract.getUserOnboardingStatus(USER_ADDRESS);
            const [, , , newCvtcAccumulated] = newStatus;
            console.log(`🪙 Nouveaux CVTC: ${ethers.formatUnits(newCvtcAccumulated, 18)} CVTC`);

            return;
        } catch (error) {
            console.log(`❌ Swap quotidien normal échoué: ${error.reason || error.message}`);
        }

        // Si ça échoue, essayer d'appeler _performSwap directement
        console.log('');
        console.log('🔄 Tentative 2: Appel direct de _performSwap...');

        try {
            const tx = await contract._performSwap(USER_ADDRESS, dailyAmount);
            console.log(`📤 Transaction: ${tx.hash}`);

            const receipt = await tx.wait();
            console.log('✅ Swap direct réussi!');
            console.log(`📊 Gas: ${receipt.gasUsed}`);

            // Vérifier le nouveau statut
            const newStatus = await contract.getUserOnboardingStatus(USER_ADDRESS);
            const [, , , newCvtcAccumulated] = newStatus;
            console.log(`🪙 Nouveaux CVTC: ${ethers.formatUnits(newCvtcAccumulated, 18)} CVTC`);

        } catch (error) {
            console.log(`❌ Swap direct échoué: ${error.reason || error.message}`);
            console.log('💡 Le contrat swap n\'a peut-être pas assez de liquidité');
        }

    } catch (error) {
        console.error('❌ Erreur générale:', error);
    }
}

forceDailySwap().catch(console.error);