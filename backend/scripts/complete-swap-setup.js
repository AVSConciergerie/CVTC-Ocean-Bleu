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

// Adresse de l'utilisateur
const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

// ABI pour le contrat swap
const swapABI = [
    "function addLiquidity(uint256 cvtcAmount) external payable",
    "function buyForUser(address user, uint256 minCvtcOut) external payable",
    "function getReserves() external view returns (uint256, uint256)",
    "function cvtcToken() external view returns (address)"
];

// ABI pour le token CVTC
const cvtcABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)"
];

async function completeSwapSetup() {
    console.log('🎯 CONFIGURATION COMPLÈTE DES SWAPS');
    console.log('==================================');

    try {
        const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
        const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);

        console.log(`👤 Utilisateur: ${USER_ADDRESS}`);
        console.log(`👑 Opérateur: ${operatorWallet.address}`);
        console.log(`📍 Contrat swap: ${SWAP_CONTRACT_ADDRESS}`);
        console.log('');

        // Vérifier les soldes
        const bnbBalance = await provider.getBalance(operatorWallet.address);
        console.log(`💰 Solde BNB: ${ethers.formatEther(bnbBalance)} BNB`);

        const swapContract = new ethers.Contract(SWAP_CONTRACT_ADDRESS, swapABI, operatorWallet);
        const cvtcToken = new ethers.Contract(CVTC_TOKEN_ADDRESS, cvtcABI, operatorWallet);

        const cvtcBalance = await cvtcToken.balanceOf(operatorWallet.address);
        console.log(`🪙 Solde CVTC: ${ethers.formatUnits(cvtcBalance, 2)} CVTC`);
        console.log('');

        // Étape 1: Ajouter de la liquidité
        console.log('💧 ÉTAPE 1: AJOUT DE LIQUIDITÉ');

        // Calculer les montants pour la liquidité
        const bnbLiquidity = ethers.parseEther("0.00004"); // Très petite quantité pour commencer
        const cvtcLiquidity = ethers.parseUnits("100000000", 2); // 100 millions CVTC

        console.log(`📥 Ajout de liquidité:`);
        console.log(`   BNB: ${ethers.formatEther(bnbLiquidity)} BNB`);
        console.log(`   CVTC: ${ethers.formatUnits(cvtcLiquidity, 2)} CVTC`);
        console.log('');

        // Vérifications
        if (bnbBalance < bnbLiquidity) {
            console.log('❌ Solde BNB insuffisant pour la liquidité');
            return;
        }

        if (cvtcBalance < cvtcLiquidity) {
            console.log('❌ Solde CVTC insuffisant pour la liquidité');
            return;
        }

        // Approuver les CVTC
        console.log('🔓 Approbation des CVTC...');
        const approveTx = await cvtcToken.approve(SWAP_CONTRACT_ADDRESS, cvtcLiquidity);
        console.log(`📤 Approbation: ${approveTx.hash}`);
        await approveTx.wait();
        console.log('✅ Approbation confirmée');
        console.log('');

        // Ajouter la liquidité
        console.log('💧 Ajout de liquidité...');
        const addLiquidityTx = await swapContract.addLiquidity(cvtcLiquidity, {
            value: bnbLiquidity,
            gasLimit: 500000
        });

        console.log(`📤 Liquidité: ${addLiquidityTx.hash}`);
        await addLiquidityTx.wait();
        console.log('✅ Liquidité ajoutée');
        console.log('');

        // Vérifier les nouvelles réserves
        const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
        console.log(`💰 Nouvelles réserves:`);
        console.log(`   BNB: ${ethers.formatEther(bnbReserve)} BNB`);
        console.log(`   CVTC: ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);
        console.log('');

        // Étape 2: Exécuter les swaps
        console.log('🔄 ÉTAPE 2: EXÉCUTION DES 3 SWAPS');

        const hashes = [];
        const costPerSwap = ethers.parseEther("0.00002");

        for (let i = 1; i <= 3; i++) {
            try {
                console.log(`📅 Swap ${i}/3...`);

                // Calculer le montant attendu
                const bnbAmount = ethers.parseEther("0.00002");
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
                await tx.wait();
                console.log(`   ✅ Swap ${i} réussi`);

                hashes.push(tx.hash);
                console.log('');

                // Pause entre les swaps
                if (i < 3) {
                    console.log('⏳ Pause de 3 secondes...');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }

            } catch (error) {
                console.error(`   ❌ Erreur swap ${i}:`, error.message);
            }
        }

        console.log('🎉 CONFIGURATION TERMINÉE!');
        console.log('==========================');

        if (hashes.length > 0) {
            console.log(`✅ ${hashes.length} swaps exécutés avec succès`);
            console.log('');
            console.log('🔗 HASHES DES TRANSACTIONS:');
            hashes.forEach((hash, index) => {
                console.log(`   ${index + 1}. https://testnet.bscscan.com/tx/${hash}`);
            });
            console.log('');
            console.log('💡 Les 3 jours manqués ont été rattrapés !');
        }

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

// Exécuter la configuration complète
completeSwapSetup().catch(console.error);