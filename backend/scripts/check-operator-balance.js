import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

const BNB_RPC_URL = process.env.BNB_RPC_URL;
const OPERATOR_PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY;

async function checkOperatorBalance() {
    console.log("🔍 VÉRIFICATION SOLDE OPÉRATEUR");
    console.log("==============================");

    if (!OPERATOR_PRIVATE_KEY) {
        console.log("❌ OPERATOR_PRIVATE_KEY non configurée");
        return;
    }

    const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
    const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);

    console.log(`👤 Adresse opérateur: ${operatorWallet.address}`);

    try {
        const balance = await provider.getBalance(operatorWallet.address);
        const balanceBNB = ethers.formatEther(balance);

        console.log(`💰 Solde BNB: ${balanceBNB} BNB`);

        const minBalance = ethers.parseEther("1.0"); // Minimum 1 BNB pour les swaps
        const hasEnough = balance >= minBalance;

        console.log(`🎯 Minimum requis: ${ethers.formatEther(minBalance)} BNB`);
        console.log(`✅ Suffisant: ${hasEnough ? 'OUI' : 'NON'}`);

        if (!hasEnough) {
            console.log("\\n❌ SOLDE INSUFFISANT");
            console.log("=====================");
            console.log(`Manque: ${ethers.formatEther(minBalance - balance)} BNB`);
            console.log("\\n💡 Actions requises:");
            console.log("1. Transférer des BNB vers l'adresse opérateur");
            console.log("2. Ou réduire le montant des swaps quotidiens");
        } else {
            console.log("\\n✅ SOLDE SUFFISANT");
            console.log("===================");
            console.log("Prêt pour exécuter les premiers swaps!");
        }

    } catch (error) {
        console.log("❌ Erreur:", error.message);
    }
}

checkOperatorBalance().catch(console.error);