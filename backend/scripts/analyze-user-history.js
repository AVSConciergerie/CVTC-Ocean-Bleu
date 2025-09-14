import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const {
    BNB_RPC_URL
} = process.env;

// Adresses des contrats
const ONBOARDING_CONTRACT_ADDRESS = "0xf3af730B6eaF257EC44b244d56F3073Fd6B593c5";
const SWAP_CONTRACT_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";

// Adresse de l'utilisateur
const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

// Événements à surveiller
const ONBOARDING_EVENTS = [
    "OnboardingStarted(address,uint256,uint256)",
    "DailySwapExecuted(address,uint256,uint256)",
    "RepaymentProcessed(address,uint8,uint256)",
    "OnboardingCompleted(address,uint256)"
];

async function analyzeUserHistory() {
    console.log('🔍 ANALYSE DE L\'HISTORIQUE UTILISATEUR');
    console.log('=====================================');

    try {
        const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);

        console.log(`👤 Utilisateur: ${USER_ADDRESS}`);
        console.log(`📍 Contrat onboarding: ${ONBOARDING_CONTRACT_ADDRESS}`);
        console.log(`📍 Contrat swap: ${SWAP_CONTRACT_ADDRESS}`);
        console.log('');

        // 1. Vérifier le statut actuel dans le contrat onboarding
        console.log('📊 STATUT ACTUEL DANS ONBOARDING:');
        const onboardingContract = new ethers.Contract(
            ONBOARDING_CONTRACT_ADDRESS,
            ["function getUserOnboardingStatus(address user) external view returns (bool,bool,uint256,uint256,uint8,uint256)"],
            provider
        );

        const status = await onboardingContract.getUserOnboardingStatus(USER_ADDRESS);
        const [isActive, completed, daysRemaining, cvtcAccumulated, currentPalier, totalRepaid] = status;

        console.log(`   Actif: ${isActive}`);
        console.log(`   Terminé: ${completed}`);
        console.log(`   Jours restants: ${daysRemaining}`);
        console.log(`   CVTC accumulés: ${ethers.formatEther(cvtcAccumulated)} CVTC`);
        console.log(`   Palier actuel: ${currentPalier}`);
        console.log(`   Total remboursé: ${ethers.formatEther(totalRepaid)} BNB`);
        console.log('');

        // 2. Analyser l'historique des transactions
        console.log('📜 HISTORIQUE DES TRANSACTIONS:');

        // Récupérer les derniers blocs
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = currentBlock - 10000; // Derniers 10000 blocs

        console.log(`   Analyse des blocs ${fromBlock} à ${currentBlock}...`);

        // Vérifier les transactions vers le contrat onboarding
        const onboardingFilter = {
            address: ONBOARDING_CONTRACT_ADDRESS,
            fromBlock: fromBlock,
            toBlock: currentBlock
        };

        const onboardingLogs = await provider.getLogs(onboardingFilter);
        console.log(`   📝 ${onboardingLogs.length} transactions trouvées vers onboarding`);

        // Filtrer les transactions de l'utilisateur
        const userOnboardingTxs = onboardingLogs.filter(log => {
            // Analyser les données de la transaction pour voir si elle concerne l'utilisateur
            try {
                const data = log.data;
                // Les adresses sont généralement aux positions 24-64 dans les données
                const addressInData = '0x' + data.slice(26, 66);
                return addressInData.toLowerCase() === USER_ADDRESS.toLowerCase();
            } catch {
                return false;
            }
        });

        console.log(`   🎯 ${userOnboardingTxs.length} transactions de l'utilisateur vers onboarding`);

        if (userOnboardingTxs.length > 0) {
            console.log('   📋 Détails des transactions:');
            for (const tx of userOnboardingTxs.slice(-5)) { // Afficher les 5 dernières
                const txDetails = await provider.getTransaction(tx.transactionHash);
                console.log(`      Hash: ${tx.transactionHash}`);
                console.log(`      De: ${txDetails.from}`);
                console.log(`      Vers: ${txDetails.to}`);
                console.log(`      Valeur: ${ethers.formatEther(txDetails.value)} BNB`);
                console.log(`      Bloc: ${tx.blockNumber}`);
                console.log('');
            }
        }

        // 3. Vérifier les événements
        console.log('🎉 ÉVÉNEMENTS ONBOARDING:');
        const onboardingInterface = new ethers.Interface([
            "event OnboardingStarted(address indexed user, uint256 loanAmount, uint256 startDate)",
            "event DailySwapExecuted(address indexed user, uint256 bnbAmount, uint256 cvtcReceived)",
            "event OnboardingCompleted(address indexed user, uint256 totalCvtcKept)"
        ]);

        for (const log of onboardingLogs.slice(-10)) { // Analyser les 10 derniers logs
            try {
                const parsedLog = onboardingInterface.parseLog(log);
                if (parsedLog.args.user.toLowerCase() === USER_ADDRESS.toLowerCase()) {
                    console.log(`   🎯 ${parsedLog.name}:`);
                    console.log(`      Utilisateur: ${parsedLog.args.user}`);
                    if (parsedLog.name === 'OnboardingStarted') {
                        console.log(`      Prêt: ${ethers.formatEther(parsedLog.args.loanAmount)} BNB`);
                        console.log(`      Date: ${new Date(Number(parsedLog.args.startDate) * 1000).toISOString()}`);
                    } else if (parsedLog.name === 'DailySwapExecuted') {
                        console.log(`      BNB: ${ethers.formatEther(parsedLog.args.bnbAmount)} BNB`);
                        console.log(`      CVTC reçu: ${ethers.formatEther(parsedLog.args.cvtcReceived)} CVTC`);
                    }
                    console.log('');
                }
            } catch {
                // Log non parsable, ignorer
            }
        }

        // 4. Vérifier le solde du contrat onboarding
        console.log('💰 SOLDE DU CONTRAT ONBOARDING:');
        const contractBalance = await provider.getBalance(ONBOARDING_CONTRACT_ADDRESS);
        console.log(`   ${ethers.formatEther(contractBalance)} BNB`);
        console.log('');

        // 5. Diagnostic
        console.log('🔬 DIAGNOSTIC:');
        if (!isActive && !completed) {
            console.log('   ❌ L\'utilisateur n\'a jamais été activé dans le contrat');
            console.log('   💡 Cause possible: acceptOnboardingTerms() n\'a jamais été appelée');
        } else if (completed) {
            console.log('   ✅ L\'onboarding est terminé');
            console.log('   💡 L\'utilisateur a complété les 30 jours');
        } else if (!isActive) {
            console.log('   ⚠️ L\'utilisateur a été désactivé');
            console.log('   💡 Cause possible: problème lors d\'un swap ou remboursement');
        }

        console.log('');
        console.log('🎯 RECOMMANDATIONS:');
        if (!isActive && !completed) {
            console.log('   1. Appeler acceptOnboardingTerms() pour l\'utilisateur');
            console.log('   2. Vérifier que l\'utilisateur a assez de BNB');
            console.log('   3. Vérifier que le contrat onboarding a des fonds');
        } else if (!isActive && completed) {
            console.log('   1. L\'onboarding est terminé - pas de swaps supplémentaires');
            console.log('   2. Vérifier si l\'utilisateur peut accéder aux fonctionnalités premium');
        }

    } catch (error) {
        console.error('❌ Erreur lors de l\'analyse:', error.message);
    }
}

// Exécuter l'analyse
analyzeUserHistory().catch(console.error);