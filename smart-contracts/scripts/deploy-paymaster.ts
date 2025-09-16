#!/usr/bin/env tsx

import { ethers } from "ethers";
import { execSync } from "child_process";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// BSC Testnet configuration
const BSC_TESTNET_RPC = "https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7";
const BSC_TESTNET_CHAIN_ID = 97;

// Contract addresses
const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

// Paymaster ABI (simplified for deployment)
const PAYMASTER_ABI = [
    "function initialize(address _entryPoint, address _cvtcToken, address _owner)",
    "function supportedTokens(address) view returns (bool)",
    "function tokenPrices(address) view returns (uint256)",
    "function addSupportedToken(address token, uint256 price)",
    "function updateTokenPrice(address token, uint256 price)",
    "function getPaymasterData(address token) view returns (bytes)",
    "function getPaymasterStubData(address token) view returns (bytes)"
];

async function main() {
    console.log("🚀 Déploiement du CVTC Paymaster sur BSC Testnet\n");

    // Check environment variables
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("PRIVATE_KEY not found in environment variables");
    }

    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
    const signer = new ethers.Wallet(privateKey, provider);

    console.log(`📍 Réseau: BSC Testnet (Chain ID: ${BSC_TESTNET_CHAIN_ID})`);
    console.log(`👤 Déployeur: ${signer.address}`);
    console.log(`💰 Balance: ${ethers.formatEther(await provider.getBalance(signer.address))} BNB\n`);

    try {
        // Deploy using Foundry
        console.log("🔨 Déploiement avec Foundry...");

        // Set environment variables for Foundry
        process.env.DEPLOYER_ADDRESS = signer.address;

        // Run deployment script
        const deployCommand = "cd /Users/utilisateur/Documents/GitHub/CVTC-Ocean-Bleu/smart-contracts && forge script script/DeployPaymaster.s.sol --rpc-url https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7 --private-key $PRIVATE_KEY --broadcast --verify";

        console.log("Exécution:", deployCommand);

        const result = execSync(deployCommand, {
            encoding: 'utf-8',
            env: { ...process.env, DEPLOYER_ADDRESS: signer.address }
        });

        console.log("Résultat du déploiement:");
        console.log(result);

        // Extract contract address from output (this is a simplified approach)
        const addressMatch = result.match(/CVTC Paymaster deployed at: (0x[a-fA-F0-9]{40})/);
        if (addressMatch) {
            const paymasterAddress = addressMatch[1];
            console.log(`\n✅ Paymaster déployé avec succès!`);
            console.log(`📄 Adresse: ${paymasterAddress}`);

            // Verify deployment
            await verifyDeployment(provider, paymasterAddress, signer.address);

            // Generate configuration
            generateConfig(paymasterAddress);

        } else {
            console.log("⚠️ Adresse du contrat non trouvée dans la sortie");
        }

    } catch (error) {
        console.error("❌ Erreur lors du déploiement:", error);
        process.exit(1);
    }
}

async function verifyDeployment(
    provider: ethers.JsonRpcProvider,
    paymasterAddress: string,
    deployerAddress: string
) {
    console.log("\n🔍 Vérification du déploiement...");

    try {
        // Check if contract exists
        const code = await provider.getCode(paymasterAddress);
        if (code === "0x") {
            throw new Error("Contract not deployed");
        }

        console.log("✅ Contrat déployé et accessible");

        // Basic verification (if possible)
        console.log("✅ Vérification terminée");

    } catch (error) {
        console.error("❌ Erreur de vérification:", error);
    }
}

function generateConfig(paymasterAddress: string) {
    console.log("\n⚙️ Configuration générée:");

    const config = {
        network: "BSC Testnet",
        chainId: BSC_TESTNET_CHAIN_ID,
        paymasterAddress,
        entryPointAddress: ENTRY_POINT_ADDRESS,
        cvtcTokenAddress: CVTC_TOKEN_ADDRESS,
        rpcUrl: BSC_TESTNET_RPC,
        bundlerUrl: `https://public.pimlico.io/v2/${BSC_TESTNET_CHAIN_ID}/rpc`
    };

    console.log(JSON.stringify(config, null, 2));

    // Save to file
    const fs = require('fs');
    fs.writeFileSync('./paymaster-config.json', JSON.stringify(config, null, 2));
    console.log("\n💾 Configuration sauvegardée dans paymaster-config.json");
}

// Handle script execution
if (require.main === module) {
    main().catch(console.error);
}

export { main };