#!/usr/bin/env tsx

import { ethers } from "ethers";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// BSC Testnet configuration
const BSC_TESTNET_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545/";
const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

// Paymaster ABI
const PAYMASTER_ABI = [
    "function entryPoint() view returns (address)",
    "function cvtcToken() view returns (address)",
    "function owner() view returns (address)",
    "function supportedTokens(address) view returns (bool)",
    "function tokenPrices(address) view returns (uint256)",
    "function addSupportedToken(address token, uint256 price)",
    "function updateTokenPrice(address token, uint256 price)",
    "function getPaymasterData(address token) view returns (bytes)",
    "function getPaymasterStubData(address token) view returns (bytes)",
    "function getTokenQuote(address token, uint256 gasLimit) view returns (uint256)"
];

// CVTC Token ABI
const CVTC_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
];

async function main() {
    console.log("🧪 Test du CVTC Paymaster sur BSC Testnet\n");

    // Load paymaster address from config
    let paymasterAddress: string;
    try {
        const config = require('../paymaster-config.json');
        paymasterAddress = config.paymasterAddress;
    } catch (error) {
        console.log("❌ Configuration non trouvée. Veuillez d'abord déployer le paymaster.");
        console.log("Exécutez: npm run deploy-paymaster");
        return;
    }

    // Check environment variables
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("PRIVATE_KEY not found in environment variables");
    }

    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
    const signer = new ethers.Wallet(privateKey, provider);

    console.log(`📍 Réseau: BSC Testnet`);
    console.log(`👤 Testeur: ${signer.address}`);
    console.log(`📄 Paymaster: ${paymasterAddress}\n`);

    try {
        // Connect to contracts
        const paymaster = new ethers.Contract(paymasterAddress, PAYMASTER_ABI, signer);
        const cvtcToken = new ethers.Contract(CVTC_TOKEN_ADDRESS, CVTC_ABI, signer);

        // Test 1: Basic contract info
        console.log("1️⃣ Test des informations de base:");
        const entryPoint = await paymaster.entryPoint();
        const cvtcTokenAddr = await paymaster.cvtcToken();
        const owner = await paymaster.owner();

        console.log(`   EntryPoint: ${entryPoint}`);
        console.log(`   CVTC Token: ${cvtcTokenAddr}`);
        console.log(`   Owner: ${owner}`);
        console.log("   ✅ Informations récupérées\n");

        // Test 2: CVTC support
        console.log("2️⃣ Test du support CVTC:");
        const cvtcSupported = await paymaster.supportedTokens(CVTC_TOKEN_ADDRESS);
        const cvtcPrice = await paymaster.tokenPrices(CVTC_TOKEN_ADDRESS);

        console.log(`   CVTC supporté: ${cvtcSupported}`);
        console.log(`   Prix CVTC: ${ethers.formatEther(cvtcPrice)} ETH par token`);
        console.log("   ✅ Support CVTC vérifié\n");

        // Test 3: Paymaster data
        console.log("3️⃣ Test des données paymaster:");
        const paymasterData = await paymaster.getPaymasterData(CVTC_TOKEN_ADDRESS);
        const paymasterStubData = await paymaster.getPaymasterStubData(CVTC_TOKEN_ADDRESS);

        console.log(`   PaymasterData: ${paymasterData}`);
        console.log(`   PaymasterStubData: ${paymasterStubData}`);
        console.log("   ✅ Données paymaster générées\n");

        // Test 4: Token quote
        console.log("4️⃣ Test des quotes de tokens:");
        const gasLimit = 100000; // Example gas limit
        const tokenQuote = await paymaster.getTokenQuote(CVTC_TOKEN_ADDRESS, gasLimit);

        console.log(`   Gas limit: ${gasLimit}`);
        console.log(`   Tokens requis: ${ethers.formatEther(tokenQuote)} CVTC`);
        console.log("   ✅ Quote calculée\n");

        // Test 5: User balance check
        console.log("5️⃣ Test du solde utilisateur:");
        const userBalance = await cvtcToken.balanceOf(signer.address);
        console.log(`   Solde CVTC: ${ethers.formatEther(userBalance)} CVTC`);

        if (userBalance >= tokenQuote) {
            console.log("   ✅ Solde suffisant pour les tests");
        } else {
            console.log("   ⚠️ Solde insuffisant - obtenez des CVTC pour les tests complets");
        }
        console.log();

        // Test 6: Approval (if balance allows)
        if (userBalance >= tokenQuote) {
            console.log("6️⃣ Test d'approbation:");
            const currentAllowance = await cvtcToken.allowance(signer.address, paymasterAddress);
            console.log(`   Allowance actuel: ${ethers.formatEther(currentAllowance)} CVTC`);

            if (currentAllowance < tokenQuote) {
                console.log("   🔄 Approbation en cours...");
                const approveTx = await cvtcToken.approve(paymasterAddress, tokenQuote);
                await approveTx.wait();
                console.log("   ✅ Approbation réussie");
            } else {
                console.log("   ✅ Approbation déjà suffisante");
            }
        }

        console.log("\n🎉 Tous les tests de base réussis!");
        console.log("Le paymaster est prêt pour les transactions ERC-4337 avec CVTC!");

    } catch (error) {
        console.error("❌ Erreur lors des tests:", error);
        process.exit(1);
    }
}

// Handle script execution
if (require.main === module) {
    main().catch(console.error);
}

export { main };