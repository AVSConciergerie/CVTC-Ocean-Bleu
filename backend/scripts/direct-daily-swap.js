import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const {
    BNB_RPC_URL,
    OPERATOR_PRIVATE_KEY
} = process.env;

// Adresses des contrats
const ONBOARDING_CONTRACT_ADDRESS = "0xf3af730B6eaF257EC44b244d56F3073Fd6B593c5";

// Adresse de l'utilisateur
const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

async function directDailySwap() {
    console.log('⚡ SWAP QUOTIDIEN DIRECT (OPERATEUR AUTORISÉ)');
    console.log('==========================================');

    try {
        const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
        const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);

        // ABI pour executeDailySwap
        const onboardingABI = [
            "function executeDailySwap(address user) external"
        ];

        const contract = new ethers.Contract(ONBOARDING_CONTRACT_ADDRESS, onboardingABI, operatorWallet);

        console.log(`👤 Utilisateur: ${USER_ADDRESS}`);
        console.log(`👑 Opérateur: ${operatorWallet.address}`);
        console.log(`📍 Contrat: ${ONBOARDING_CONTRACT_ADDRESS}`);
        console.log('');

        // Vérifier le solde de l'opérateur
        const balance = await provider.getBalance(operatorWallet.address);
        console.log(`💰 Solde opérateur: ${ethers.formatEther(balance)} BNB`);

        // Vérifier le solde du contrat
        const contractBalance = await provider.getBalance(ONBOARDING_CONTRACT_ADDRESS);
        console.log(`💰 Solde contrat: ${ethers.formatEther(contractBalance)} BNB`);

        if (contractBalance < ethers.parseEther("0.000013")) {
            console.log('❌ Contrat insuffisant pour swap quotidien (0.000013 BNB requis)');
            return;
        }

        console.log('🔄 Exécution du swap quotidien...');

        // Exécuter le swap quotidien
        const tx = await contract.executeDailySwap(USER_ADDRESS);
        console.log(`📤 Transaction envoyée: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log('✅ Transaction confirmée!');
        console.log(`📊 Gas utilisé: ${receipt.gasUsed}`);

        // Afficher les détails de la transaction
        console.log('');
        console.log('🎉 SWAP QUOTIDIEN RÉUSSI!');
        console.log('========================');
        console.log(`🔗 HASH: https://testnet.bscscan.com/tx/${tx.hash}`);

        // Vérifier les logs de la transaction pour voir les événements
        if (receipt.logs && receipt.logs.length > 0) {
            console.log('');
            console.log('📋 ÉVÉNEMENTS:');
            for (const log of receipt.logs) {
                try {
                    // Essayer de décoder comme DailySwapExecuted
                    const eventSignature = "DailySwapExecuted(address,uint256,uint256)";
                    if (log.topics[0] === ethers.keccak256(ethers.toUtf8Bytes(eventSignature))) {
                        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
                            ["address", "uint256", "uint256"],
                            log.data
                        );
                        console.log(`   💱 Swap exécuté:`);
                        console.log(`      Utilisateur: ${decoded[0]}`);
                        console.log(`      BNB: ${ethers.formatEther(decoded[1])} BNB`);
                        console.log(`      CVTC reçu: ${ethers.formatEther(decoded[2])} CVTC`);
                    }
                } catch {
                    // Log non décodable, ignorer
                }
            }
        }

    } catch (error) {
        console.error('❌ Erreur lors du swap:', error.message);

        if (error.message.includes("User not active")) {
            console.log('💡 L\'utilisateur n\'est pas actif dans le contrat onboarding');
            console.log('💡 Solution: Réactiver l\'utilisateur ou utiliser le contrat swap directement');
        } else if (error.message.includes("Too early")) {
            console.log('💡 Il est trop tôt pour le prochain swap quotidien');
        } else if (error.message.includes("Insufficient contract balance")) {
            console.log('💡 Le contrat n\'a pas assez de BNB pour le swap');
        }
    }
}

// Exécuter le swap direct
directDailySwap().catch(console.error);