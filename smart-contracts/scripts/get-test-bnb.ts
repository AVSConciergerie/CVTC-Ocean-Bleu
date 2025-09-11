#!/usr/bin/env tsx

import { ethers } from "ethers";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
    console.log("🤑 OBTENTION DE BNB DE TEST SUR BSC TESTNET\n");

    // Check environment variables
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("❌ PRIVATE_KEY not found in environment variables");
    }

    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
    const signer = new ethers.Wallet(privateKey, provider);

    console.log(`👤 Adresse: ${signer.address}`);
    console.log(`💰 Balance actuelle: ${ethers.formatEther(await provider.getBalance(signer.address))} BNB\n`);

    console.log("🔗 INSTRUCTIONS POUR OBTENIR DES BNB DE TEST:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("1. Rendez-vous sur le faucet BSC Testnet:");
    console.log("   https://testnet.binance.org/faucet-smart");
    console.log("");
    console.log("2. Connectez-vous avec votre wallet MetaMask");
    console.log("");
    console.log("3. Demandez des BNB de test (0.5 BNB devraient suffire)");
    console.log("");
    console.log("4. Attendez quelques minutes que la transaction soit confirmée");
    console.log("");
    console.log("5. Vérifiez votre balance:");
    console.log(`   Adresse: ${signer.address}`);
    console.log("");
    console.log("6. Relancez le déploiement:");
    console.log("   npm run deploy-complete");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("💡 ASTUCES:");
    console.log("• Vous pouvez demander des BNB toutes les 24h");
    console.log("• 0.1 BNB suffisent largement pour le déploiement");
    console.log("• Gardez quelques BNB pour les tests futurs");
    console.log("");

    // Alternative: Vérifier si on peut obtenir des BNB automatiquement
    console.log("🔄 ALTERNATIVE: DÉPLOIEMENT AVEC PEU DE BNB");
    console.log("Si vous avez très peu de BNB, vous pouvez:");
    console.log("1. Utiliser un réseau de test avec des frais plus bas");
    console.log("2. Demander à quelqu'un de vous envoyer des BNB");
    console.log("3. Utiliser un service de faucet alternatif");
    console.log("");

    console.log("📞 FAUCETS ALTERNATIFS BSC TESTNET:");
    console.log("• https://faucet.quicknode.com/bsc/testnet");
    console.log("• https://bsc-faucet.com/");
    console.log("• https://testnet-faucet.bnbchain.org/");
}

// Handle script execution
if (require.main === module) {
    main().catch(console.error);
}

export { main };