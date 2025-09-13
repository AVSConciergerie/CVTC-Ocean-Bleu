import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

const BNB_RPC_URL = process.env.BNB_RPC_URL;
const OPERATOR_PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY;

async function checkSwapCapacity() {
    console.log("📊 CAPACITÉ DE SWAPS AVEC 0.00002 BNB/JOUR");
    console.log("==========================================");

    if (!OPERATOR_PRIVATE_KEY) {
        console.log("❌ OPERATOR_PRIVATE_KEY non configurée");
        return;
    }

    const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
    const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);

    try {
        const balance = await provider.getBalance(operatorWallet.address);
        const balanceBNB = parseFloat(ethers.formatEther(balance));

        console.log(`💰 Solde actuel: ${balanceBNB} BNB`);
        console.log(`💸 Coût par swap: 0.00002 BNB`);

        // Calculs
        const swapsPossible = Math.floor(balanceBNB / 0.00002);
        const daysCovered = Math.floor(swapsPossible / 30); // 30 utilisateurs par jour
        const costPerDay = 30 * 0.00002; // 30 utilisateurs * 0.00002 BNB
        const daysPossible = Math.floor(balanceBNB / costPerDay);

        console.log(`\\n📈 CAPACITÉS CALCULÉES:`);
        console.log(`🔢 Swaps possibles: ${swapsPossible.toLocaleString()}`);
        console.log(`📅 Jours couverts (30 users/jour): ${daysPossible} jours`);
        console.log(`💰 Coût journalier: ${costPerDay} BNB`);
        console.log(`📊 BNB nécessaires pour 30 jours: ${(30 * 0.00002 * 30).toFixed(6)} BNB`);

        if (balanceBNB >= 0.001) { // Au moins pour quelques swaps
            console.log("\\n✅ CAPACITÉ SUFFISANTE");
            console.log("=======================");
            console.log("🎯 Prêt pour les swaps quotidiens!");
            console.log(`🚀 Peut supporter ~${daysPossible} jours d'activité`);
        } else {
            console.log("\\n❌ CAPACITÉ INSUFFISANTE");
            console.log("=========================");
            console.log("Besoin d'au moins 0.001 BNB pour commencer");
        }

        console.log(`\\n💡 RECOMMANDATIONS:`);
        console.log(`Maintenir solde > 0.1 BNB pour sécurité`);
        console.log(`Coût mensuel estimé: ${(30 * 0.00002 * 30).toFixed(6)} BNB`);

    } catch (error) {
        console.log("❌ Erreur:", error.message);
    }
}

checkSwapCapacity().catch(console.error);