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
    "function addLiquidity(uint256 cvtcAmount) external payable",
    "function getReserves() external view returns (uint256, uint256)",
    "function cvtcToken() external view returns (address)"
];

// ABI pour le token CVTC
const cvtcABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)"
];

async function addSwapLiquidity() {
    console.log('💰 AJOUT DE LIQUIDITÉ AU CONTRAT SWAP');
    console.log('====================================');

    try {
        const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
        const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);

        console.log(`👑 Opérateur (owner): ${operatorWallet.address}`);
        console.log(`📍 Contrat swap: ${SWAP_CONTRACT_ADDRESS}`);
        console.log(`🪙 Token CVTC: ${CVTC_TOKEN_ADDRESS}`);
        console.log('');

        // Vérifier le solde BNB de l'opérateur
        const bnbBalance = await provider.getBalance(operatorWallet.address);
        console.log(`💰 Solde BNB: ${ethers.formatEther(bnbBalance)} BNB`);

        // Créer les instances des contrats
        const swapContract = new ethers.Contract(SWAP_CONTRACT_ADDRESS, swapABI, operatorWallet);
        const cvtcToken = new ethers.Contract(CVTC_TOKEN_ADDRESS, cvtcABI, operatorWallet);

        // Vérifier le solde CVTC de l'opérateur
        const cvtcBalance = await cvtcToken.balanceOf(operatorWallet.address);
        console.log(`🪙 Solde CVTC: ${ethers.formatUnits(cvtcBalance, 2)} CVTC`);
        console.log('');

        // Vérifier les réserves actuelles
        const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
        console.log(`💰 Réserves actuelles:`);
        console.log(`   BNB: ${ethers.formatEther(bnbReserve)} BNB`);
        console.log(`   CVTC: ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);
        console.log('');

        // Calculer les montants à ajouter selon le ratio réel
        const bnbAmount = ethers.parseEther("0.00002"); // 0.00002 BNB
        const cvtcAmount = ethers.parseUnits("2500000000", 2); // 2,500,000,000 CVTC

        console.log(`📥 Montants à ajouter (ratio réel):`);
        console.log(`   BNB: ${ethers.formatEther(bnbAmount)} BNB`);
        console.log(`   CVTC: ${ethers.formatUnits(cvtcAmount, 2)} CVTC`);
        console.log(`   Ratio: 1 BNB = ${ethers.formatUnits(cvtcAmount, 2)} CVTC`);
        console.log('');

        // Vérifications
        if (bnbBalance < bnbAmount) {
            console.log(`❌ Solde BNB insuffisant`);
            return;
        }

        if (cvtcBalance < cvtcAmount) {
            console.log(`❌ Solde CVTC insuffisant`);
            return;
        }

        // Étape 1: Approuver le contrat swap à dépenser les CVTC
        console.log('🔓 Approbation des CVTC...');
        const approveTx = await cvtcToken.approve(SWAP_CONTRACT_ADDRESS, cvtcAmount);
        console.log(`📤 Transaction d'approbation: ${approveTx.hash}`);

        const approveReceipt = await approveTx.wait();
        console.log(`✅ Approbation confirmée - Gas: ${approveReceipt.gasUsed}`);
        console.log('');

        // Étape 2: Ajouter la liquidité
        console.log('💧 Ajout de liquidité...');
        const addLiquidityTx = await swapContract.addLiquidity(cvtcAmount, {
            value: bnbAmount,
            gasLimit: 500000
        });

        console.log(`📤 Transaction d'ajout: ${addLiquidityTx.hash}`);

        const addLiquidityReceipt = await addLiquidityTx.wait();
        console.log(`✅ Liquidité ajoutée - Gas: ${addLiquidityReceipt.gasUsed}`);
        console.log('');

        // Vérifier les nouvelles réserves
        const [newBnbReserve, newCvtcReserve] = await swapContract.getReserves();
        console.log(`💰 Nouvelles réserves:`);
        console.log(`   BNB: ${ethers.formatEther(newBnbReserve)} BNB`);
        console.log(`   CVTC: ${ethers.formatUnits(newCvtcReserve, 2)} CVTC`);
        console.log('');

        const bnbAdded = newBnbReserve - bnbReserve;
        const cvtcAdded = newCvtcReserve - cvtcReserve;

        console.log('🎉 LIQUIDITÉ AJOUTÉE AVEC SUCCÈS!');
        console.log('===============================');
        console.log(`💰 BNB ajouté: ${ethers.formatEther(bnbAdded)} BNB`);
        console.log(`🪙 CVTC ajouté: ${ethers.formatUnits(cvtcAdded, 2)} CVTC`);
        console.log('');
        console.log('✅ Le contrat swap a maintenant des réserves utilisables');
        console.log('🚀 Les swaps peuvent maintenant être exécutés');

    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout de liquidité:', error.message);
    }
}

// Exécuter l'ajout de liquidité
addSwapLiquidity().catch(console.error);