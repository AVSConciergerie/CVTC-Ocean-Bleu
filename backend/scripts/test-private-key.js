import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const privateKey = process.env.OPERATOR_PRIVATE_KEY;

console.log('🔐 TEST DE VALIDITÉ DE LA CLÉ PRIVÉE');
console.log('====================================');

try {
    console.log('Clé privée (masquée):', privateKey ? privateKey.substring(0, 10) + '...' : 'NON DÉFINIE');

    if (!privateKey) {
        console.log('❌ OPERATOR_PRIVATE_KEY non définie dans .env');
        process.exit(1);
    }

    // Tester la création du wallet
    const wallet = new ethers.Wallet(privateKey);
    console.log('✅ Clé privée valide!');
    console.log('📍 Adresse publique:', wallet.address);

    // Tester la connexion au réseau
    const provider = new ethers.JsonRpcProvider(process.env.BNB_RPC_URL);
    const connectedWallet = wallet.connect(provider);
    console.log('✅ Connexion au réseau réussie');

    // Vérifier le solde
    const balance = await provider.getBalance(wallet.address);
    console.log('💰 Solde BNB:', ethers.formatEther(balance));

} catch (error) {
    console.log('❌ Clé privée invalide:', error.message);
    console.log('');
    console.log('💡 Solutions:');
    console.log('1. Vérifiez que la clé privée commence par 0x');
    console.log('2. Assurez-vous qu\'elle fait exactement 66 caractères (0x + 64 caractères hex)');
    console.log('3. Vérifiez qu\'elle ne contient que des caractères hexadécimaux valides (0-9, a-f)');
    process.exit(1);
}