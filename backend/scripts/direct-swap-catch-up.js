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

// ABI pour exécuter les swaps
const onboardingABI = [
    "function executeDailySwap(address user) external"
];

// Adresse de l'utilisateur
const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

async function directSwapCatchUp() {
    console.log('⚡ RATTRAPAGE DIRECT DES SWAPS MANQUÉS');
    console.log('=====================================');

    try {
        const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
        const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(ONBOARDING_CONTRACT_ADDRESS, onboardingABI, operatorWallet);

        console.log(`👤 Utilisateur: ${USER_ADDRESS}`);
        console.log(`👑 Opérateur: ${operatorWallet.address}`);
        console.log(`📍 Contrat: ${ONBOARDING_CONTRACT_ADDRESS}`);
        console.log('');

        // Vérifier le solde de l'opérateur
        const balance = await provider.getBalance(operatorWallet.address);
        console.log(`💰 Solde opérateur: ${ethers.formatEther(balance)} BNB`);

        const costPerSwap = ethers.parseEther("0.01");
        const totalCost = costPerSwap * 3n; // 3 swaps

        if (balance < totalCost) {
            console.log(`❌ Solde insuffisant: ${ethers.formatEther(totalCost)} BNB requis`);
            return;
        }

        console.log('🔄 Exécution des 3 swaps manqués...');
        const hashes = [];

        for (let i = 1; i <= 3; i++) {
            try {
                console.log(`📅 Swap ${i}/3...`);

                const tx = await contract.executeDailySwap(USER_ADDRESS);
                console.log(`   📤 Transaction: ${tx.hash}`);

                const receipt = await tx.wait();
                console.log(`   ✅ Confirmé - Gas: ${receipt.gasUsed}`);

                hashes.push(tx.hash);
                console.log('');

                // Petite pause entre les transactions
                if (i < 3) {
                    console.log('⏳ Pause de 5 secondes...');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }

            } catch (error) {
                console.error(`   ❌ Erreur swap ${i}:`, error.message);
                console.log('');
            }
        }

        console.log('🎉 RATTRAPAGE TERMINÉ!');
        console.log('====================');
        console.log(`📊 ${hashes.length} swaps exécutés avec succès`);
        console.log('');

        if (hashes.length > 0) {
            console.log('🔗 HASHES DES TRANSACTIONS:');
            hashes.forEach((hash, index) => {
                console.log(`   ${index + 1}. ${hash}`);
            });
            console.log('');
            console.log('💡 Vous pouvez vérifier ces transactions sur BscScan');
        }

    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

// Exécuter le rattrapage direct
directSwapCatchUp().catch(console.error);