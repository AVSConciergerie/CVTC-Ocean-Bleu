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
    "function addLiquidityPublic(uint256 cvtcAmount) external payable",
    "function buyForUser(address user, uint256 minCvtcOut) external payable",
    "function getReserves() external view returns (uint256, uint256)",
    "function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) external pure returns (uint256)"
];

// ABI pour le token CVTC
const cvtcABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)"
];

async function testAMMSystem() {
    console.log('🧪 TEST DU SYSTÈME AMM CORRIGÉ');
    console.log('==============================');

    try {
        const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
        const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);

        console.log(`👤 Utilisateur: ${USER_ADDRESS}`);
        console.log(`👑 Opérateur: ${operatorWallet.address}`);
        console.log(`📍 Contrat swap: ${SWAP_CONTRACT_ADDRESS}`);
        console.log('');

        // Créer les instances des contrats
        const swapContract = new ethers.Contract(SWAP_CONTRACT_ADDRESS, swapABI, operatorWallet);
        const cvtcToken = new ethers.Contract(CVTC_TOKEN_ADDRESS, cvtcABI, operatorWallet);

        // Vérifier les soldes
        const bnbBalance = await provider.getBalance(operatorWallet.address);
        const cvtcBalance = await cvtcToken.balanceOf(operatorWallet.address);

        console.log(`💰 Solde BNB: ${ethers.formatEther(bnbBalance)} BNB`);
        console.log(`🪙 Solde CVTC: ${ethers.formatUnits(cvtcBalance, 2)} CVTC`);
        console.log('');

        // Étape 1: Ajouter de la liquidité (AMM classique)
        console.log('💧 ÉTAPE 1: AJOUT DE LIQUIDITÉ AMM');

        const bnbLiquidity = ethers.parseEther("0.0001"); // Très petite quantité pour test
        const cvtcLiquidity = ethers.parseUnits("50000000", 2); // 50 millions CVTC

        console.log(`📥 Ajout de liquidité:`);
        console.log(`   BNB: ${ethers.formatEther(bnbLiquidity)} BNB`);
        console.log(`   CVTC: ${ethers.formatUnits(cvtcLiquidity, 2)} CVTC`);
        console.log(`   Ratio: 1 BNB = ${ethers.formatUnits(cvtcLiquidity, 2)} CVTC`);
        console.log('');

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
        console.log('✅ Liquidité ajoutée avec succès!');
        console.log('');

        // Vérifier les nouvelles réserves
        const [bnbReserve, cvtcReserve] = await swapContract.getReserves();
        console.log(`💰 Réserves actuelles:`);
        console.log(`   BNB: ${ethers.formatEther(bnbReserve)} BNB`);
        console.log(`   CVTC: ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);
        console.log('');

        // Étape 2: Tester un swap AMM
        console.log('🔄 ÉTAPE 2: TEST D\'UN SWAP AMM');

        const swapAmount = ethers.parseEther("0.00002"); // 0.01€ en BNB
        console.log(`💸 Montant du swap: ${ethers.formatEther(swapAmount)} BNB`);

        // Calculer le montant attendu
        const expectedOut = await swapContract.getAmountOut(swapAmount, bnbReserve, cvtcReserve);
        const minOut = expectedOut * 95n / 100n; // 5% slippage

        console.log(`🎯 CVTC attendu: ${ethers.formatUnits(expectedOut, 2)} CVTC`);
        console.log(`🎯 Minimum requis: ${ethers.formatUnits(minOut, 2)} CVTC`);
        console.log('');

        // Exécuter le swap AMM
        console.log('🚀 Exécution du swap AMM...');
        const swapTx = await swapContract.buyForUser(USER_ADDRESS, minOut, {
            value: swapAmount,
            gasLimit: 300000
        });

        console.log(`📤 Swap: ${swapTx.hash}`);
        const swapReceipt = await swapTx.wait();
        console.log('✅ Swap AMM réussi!');
        console.log(`📊 Gas utilisé: ${swapReceipt.gasUsed}`);
        console.log('');

        // Vérifier les réserves après swap
        const [newBnbReserve, newCvtcReserve] = await swapContract.getReserves();
        console.log(`💰 Réserves après swap:`);
        console.log(`   BNB: ${ethers.formatEther(newBnbReserve)} BNB (+${ethers.formatEther(newBnbReserve - bnbReserve)})`);
        console.log(`   CVTC: ${ethers.formatUnits(newCvtcReserve, 2)} CVTC (-${ethers.formatUnits(cvtcReserve - newCvtcReserve, 2)})`);
        console.log('');

        console.log('🎉 SYSTÈME AMM FONCTIONNEL!');
        console.log('===========================');
        console.log('✅ Liquidité ajoutée');
        console.log('✅ Swap AMM exécuté');
        console.log('✅ Réserves mises à jour');
        console.log('✅ Prix maintenu par l\'algorithme AMM');
        console.log('');
        console.log('🚀 Le système AMM est maintenant opérationnel!');

    } catch (error) {
        console.error('❌ Erreur:', error.message);

        if (error.message.includes('Ratio de liquidite incorrect')) {
            console.log('💡 Le ratio de liquidité n\'est pas respecté');
        } else if (error.message.includes('transferFrom')) {
            console.log('💡 Problème d\'approbation des tokens');
        } else if (error.message.includes('Liquidite desactivee')) {
            console.log('💡 La liquidité est désactivée');
        }
    }
}

// Exécuter le test AMM
testAMMSystem().catch(console.error);