import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const {
    BNB_RPC_URL,
    OPERATOR_PRIVATE_KEY
} = process.env;

// Adresses des contrats
const SWAP_CONTRACT_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";
const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

// ABI pour le contrat swap
const swapABI = [
    "function buyForUser(address user, uint256 minCvtcOut) external payable",
    "function getReserves() external view returns (uint256, uint256)",
    "function cvtcToken() external view returns (address)"
];

// Adresse de l'utilisateur
const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

async function emergencySwapCatchUp() {
    console.log('🚨 RATTRAPAGE D\'URGENCE VIA CONTRAT SWAP');
    console.log('======================================');

    try {
        const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
        const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);
        const swapContract = new ethers.Contract(SWAP_CONTRACT_ADDRESS, swapABI, operatorWallet);

        console.log(`👤 Utilisateur: ${USER_ADDRESS}`);
        console.log(`👑 Opérateur: ${operatorWallet.address}`);
        console.log(`📍 Contrat swap: ${SWAP_CONTRACT_ADDRESS}`);
        console.log('');

        // Vérifier le solde de l'opérateur
        const balance = await provider.getBalance(operatorWallet.address);
        console.log(`💰 Solde opérateur: ${ethers.formatEther(balance)} BNB`);

        const costPerSwap = ethers.parseEther("0.00002");
        const totalCost = costPerSwap * 3n; // 3 swaps

        if (balance < totalCost) {
            console.log(`❌ Solde insuffisant: ${ethers.formatEther(totalCost)} BNB requis`);
            return;
        }

        // Vérifier les réserves du contrat swap
        const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
        console.log(`💰 Réserves contrat:`);
        console.log(`   BNB: ${ethers.formatEther(bnbReserve)} BNB`);
        console.log(`   CVTC: ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);
        console.log('');

        if (bnbReserve < ethers.parseEther("0.00006") || cvtcReserve < 30000n) { // 3 * 0.00002 BNB minimum
            console.log('❌ Réserves insuffisantes dans le contrat swap');
            return;
        }

        console.log('🔄 Exécution des 3 swaps d\'urgence...');
        const hashes = [];

        for (let i = 1; i <= 3; i++) {
            try {
                console.log(`📅 Swap d'urgence ${i}/3...`);

                // Calculer le montant minimum attendu selon le ratio réel
                const bnbAmount = ethers.parseEther("0.00002"); // 0.01€ en BNB selon ratio réel
                const expectedCvtc = (bnbAmount * cvtcReserve) / (bnbReserve + bnbAmount);
                const minCvtcOut = expectedCvtc * 95n / 100n;

                console.log(`   💸 BNB: ${ethers.formatEther(bnbAmount)} BNB`);
                console.log(`   🎯 CVTC min: ${ethers.formatUnits(minCvtcOut, 2)} CVTC`);

                // Exécuter le swap
                const tx = await swapContract.buyForUser(USER_ADDRESS, minCvtcOut, {
                    value: bnbAmount,
                    gasLimit: 300000
                });

                console.log(`   📤 Transaction: ${tx.hash}`);

                const receipt = await tx.wait();
                console.log(`   ✅ Confirmé - Gas: ${receipt.gasUsed}`);

                hashes.push(tx.hash);
                console.log('');

                // Petite pause entre les transactions
                if (i < 3) {
                    console.log('⏳ Pause de 3 secondes...');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }

            } catch (error) {
                console.error(`   ❌ Erreur swap ${i}:`, error.message);
                console.log('');
            }
        }

        console.log('🎉 RATTRAPAGE D\'URGENCE TERMINÉ!');
        console.log('===============================');
        console.log(`📊 ${hashes.length} swaps exécutés avec succès`);
        console.log('');

        if (hashes.length > 0) {
            console.log('🔗 HASHES DES TRANSACTIONS:');
            hashes.forEach((hash, index) => {
                console.log(`   ${index + 1}. https://testnet.bscscan.com/tx/${hash}`);
            });
            console.log('');
            console.log('💡 Vous pouvez vérifier ces transactions sur BscScan Testnet');
        }

    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

// Exécuter le rattrapage d'urgence
emergencySwapCatchUp().catch(console.error);