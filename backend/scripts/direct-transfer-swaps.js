import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const {
    BNB_RPC_URL,
    OPERATOR_PRIVATE_KEY
} = process.env;

// Adresses des contrats
const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

// Adresse de l'utilisateur
const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

// ABI pour le token CVTC
const cvtcABI = [
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)"
];

async function directTransferSwaps() {
    console.log('⚡ TRANSFERTS DIRECTS DE CVTC (SIMULATION DE SWAPS)');
    console.log('=================================================');

    try {
        const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
        const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);

        console.log(`👤 Utilisateur: ${USER_ADDRESS}`);
        console.log(`👑 Opérateur: ${operatorWallet.address}`);
        console.log(`🪙 Token CVTC: ${CVTC_TOKEN_ADDRESS}`);
        console.log('');

        // Vérifier les soldes
        const cvtcToken = new ethers.Contract(CVTC_TOKEN_ADDRESS, cvtcABI, operatorWallet);
        const operatorCvtcBalance = await cvtcToken.balanceOf(operatorWallet.address);
        const userCvtcBalanceBefore = await cvtcToken.balanceOf(USER_ADDRESS);

        console.log(`💰 Solde opérateur CVTC: ${ethers.formatUnits(operatorCvtcBalance, 2)} CVTC`);
        console.log(`💰 Solde utilisateur CVTC avant: ${ethers.formatUnits(userCvtcBalanceBefore, 2)} CVTC`);
        console.log('');

        // Montant par swap (ajusté selon les fonds disponibles)
        const cvtcPerSwap = ethers.parseUnits("800000000", 2); // 800 millions CVTC par swap (réduit pour tenir dans les fonds)
        const totalCvtcNeeded = cvtcPerSwap * 3n;

        console.log(`🎯 Montant par swap: ${ethers.formatUnits(cvtcPerSwap, 2)} CVTC`);
        console.log(`💰 Total nécessaire: ${ethers.formatUnits(totalCvtcNeeded, 2)} CVTC`);
        console.log('');

        if (operatorCvtcBalance < totalCvtcNeeded) {
            console.log(`❌ Solde CVTC insuffisant: ${ethers.formatUnits(operatorCvtcBalance, 2)} disponible`);
            return;
        }

        console.log('🔄 Exécution des 3 transferts (simulation des swaps)...');
        const hashes = [];

        for (let i = 1; i <= 3; i++) {
            try {
                console.log(`📅 Transfert ${i}/3...`);
                console.log(`   🪙 Transfert: ${ethers.formatUnits(cvtcPerSwap, 2)} CVTC`);

                // Transférer les CVTC directement à l'utilisateur
                const tx = await cvtcToken.transfer(USER_ADDRESS, cvtcPerSwap);
                console.log(`   📤 Transaction: ${tx.hash}`);

                const receipt = await tx.wait();
                console.log(`   ✅ Transfert ${i} réussi - Gas: ${receipt.gasUsed}`);

                hashes.push(tx.hash);
                console.log('');

                // Pause entre les transferts
                if (i < 3) {
                    console.log('⏳ Pause de 2 secondes...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }

            } catch (error) {
                console.error(`   ❌ Erreur transfert ${i}:`, error.message);
            }
        }

        // Vérifier le solde final de l'utilisateur
        const userCvtcBalanceAfter = await cvtcToken.balanceOf(USER_ADDRESS);
        const totalTransferred = userCvtcBalanceAfter - userCvtcBalanceBefore;

        console.log('🎉 TRANSFERTS TERMINÉS!');
        console.log('=======================');
        console.log(`✅ ${hashes.length} transferts exécutés avec succès`);
        console.log(`🪙 Total transféré: ${ethers.formatUnits(totalTransferred, 2)} CVTC`);
        console.log('');

        if (hashes.length > 0) {
            console.log('🔗 HASHES DES TRANSACTIONS:');
            hashes.forEach((hash, index) => {
                console.log(`   ${index + 1}. https://testnet.bscscan.com/tx/${hash}`);
            });
            console.log('');
            console.log('💡 Ces transferts simulent les 3 swaps quotidiens manqués');
            console.log('💡 L\'utilisateur reçoit maintenant ses CVTC comme si les swaps avaient eu lieu');
        }

    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

// Exécuter les transferts directs
directTransferSwaps().catch(console.error);