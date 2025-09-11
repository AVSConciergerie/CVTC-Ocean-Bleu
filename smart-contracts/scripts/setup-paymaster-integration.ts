#!/usr/bin/env tsx

import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

// BSC Testnet configuration
const BSC_TESTNET_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545/";
const BSC_TESTNET_CHAIN_ID = 97;

// Paymaster ABI for integration
const PAYMASTER_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "_entryPoint", "type": "address"},
            {"internalType": "address", "name": "_cvtcToken", "type": "address"},
            {"internalType": "address", "name": "_owner", "type": "address"}
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "entryPoint",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "cvtcToken",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "supportedTokens",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "token", "type": "address"}],
        "name": "getPaymasterData",
        "outputs": [{"internalType": "bytes", "name": "", "type": "bytes"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "token", "type": "address"}],
        "name": "getPaymasterStubData",
        "outputs": [{"internalType": "bytes", "name": "", "type": "bytes"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "token", "type": "address"}, {"internalType": "uint256", "name": "gasLimit", "type": "uint256"}],
        "name": "getTokenQuote",
        "outputs": [{"internalType": "uint256", "name": "tokenAmount", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

async function main() {
    console.log("🔧 Configuration de l'intégration Paymaster\n");

    // Load paymaster config
    let config: any;
    try {
        config = JSON.parse(fs.readFileSync('./paymaster-config.json', 'utf8'));
    } catch (error) {
        console.log("❌ Configuration paymaster non trouvée");
        console.log("Déployez d'abord le paymaster: npm run deploy-paymaster");
        return;
    }

    const paymasterAddress = config.paymasterAddress;

    // Create PimlicoContext configuration
    const pimlicoConfig = {
        bscTestnet: {
            chainId: BSC_TESTNET_CHAIN_ID,
            rpcUrl: BSC_TESTNET_RPC,
            bundlerUrl: `https://public.pimlico.io/v2/${BSC_TESTNET_CHAIN_ID}/rpc`,
            paymasterAddress,
            entryPointAddress: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
            cvtcTokenAddress: "0x532FC49071656C16311F2f89E6e41C53243355D3"
        }
    };

    // Generate PimlicoContext with paymaster support
    const contextContent = `import React, { createContext, useContext, useState, useEffect } from 'react';
import { createWalletClient, custom } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, http } from 'viem';
import { bscTestnet } from 'viem/chains';
import { ethers } from 'ethers';

// Paymaster configuration
const PAYMASTER_CONFIG = ${JSON.stringify(pimlicoConfig, null, 4)};

// Paymaster ABI
const PAYMASTER_ABI = ${JSON.stringify(PAYMASTER_ABI, null, 4)};

const PimlicoContext = createContext();

export function PimlicoProvider({ children }) {
    const [smartAccount, setSmartAccount] = useState(null);
    const [smartAccountAddress, setSmartAccountAddress] = useState(null);
    const [error, setError] = useState(null);
    const [paymaster, setPaymaster] = useState(null);

    // BSC Testnet configuration
    const config = PAYMASTER_CONFIG.bscTestnet;

    useEffect(() => {
        initializePaymaster();
    }, []);

    const initializePaymaster = async () => {
        try {
            console.log('🔧 Initialisation du Paymaster CVTC...');

            // Create provider
            const provider = new ethers.JsonRpcProvider(config.rpcUrl);

            // Create paymaster contract instance
            const paymasterContract = new ethers.Contract(
                config.paymasterAddress,
                PAYMASTER_ABI,
                provider
            );

            setPaymaster(paymasterContract);
            console.log('✅ Paymaster initialisé:', config.paymasterAddress);

            // Test paymaster functionality
            const cvtcSupported = await paymasterContract.supportedTokens(config.cvtcTokenAddress);
            console.log('CVTC supporté par paymaster:', cvtcSupported);

        } catch (err) {
            console.error('❌ Erreur initialisation paymaster:', err);
            setError(\`Erreur paymaster: \${err.message}\`);
        }
    };

    const getPaymasterData = async (tokenAddress = config.cvtcTokenAddress) => {
        if (!paymaster) {
            throw new Error('Paymaster not initialized');
        }

        try {
            const paymasterData = await paymaster.getPaymasterData(tokenAddress);
            console.log('Paymaster data:', paymasterData);
            return paymasterData;
        } catch (err) {
            console.error('Erreur getPaymasterData:', err);
            throw err;
        }
    };

    const getPaymasterStubData = async (tokenAddress = config.cvtcTokenAddress) => {
        if (!paymaster) {
            throw new Error('Paymaster not initialized');
        }

        try {
            const stubData = await paymaster.getPaymasterStubData(tokenAddress);
            console.log('Paymaster stub data:', stubData);
            return stubData;
        } catch (err) {
            console.error('Erreur getPaymasterStubData:', err);
            throw err;
        }
    };

    const getTokenQuote = async (gasLimit, tokenAddress = config.cvtcTokenAddress) => {
        if (!paymaster) {
            throw new Error('Paymaster not initialized');
        }

        try {
            const quote = await paymaster.getTokenQuote(tokenAddress, gasLimit);
            console.log(\`Quote pour \${gasLimit} gas: \${ethers.formatEther(quote)} CVTC\`);
            return quote;
        } catch (err) {
            console.error('Erreur getTokenQuote:', err);
            throw err;
        }
    };

    const value = {
        smartAccount,
        smartAccountAddress,
        error,
        paymaster,
        config,
        getPaymasterData,
        getPaymasterStubData,
        getTokenQuote
    };

    return (
        <PimlicoContext.Provider value={value}>
            {children}
        </PimlicoContext.Provider>
    );
}

export function usePimlico() {
    const context = useContext(PimlicoContext);
    if (!context) {
        throw new Error('usePimlico must be used within a PimlicoProvider');
    }
    return context;
}

export default PimlicoContext;`;

    // Write PimlicoContext file
    const contextPath = path.join(__dirname, '../../frontend/src/context/PimlicoContext.jsx');
    fs.writeFileSync(contextPath, contextContent);

    console.log('✅ PimlicoContext mis à jour avec support paymaster');
    console.log('📄 Fichier:', contextPath);

    // Create paymaster utilities
    const utilsContent = `import { ethers } from 'ethers';

/**
 * Paymaster utilities for CVTC gas sponsorship
 */
export class PaymasterUtils {
    constructor(paymasterContract, cvtcTokenAddress) {
        this.paymaster = paymasterContract;
        this.cvtcToken = cvtcTokenAddress;
    }

    /**
     * Get paymaster data for user operation
     */
    async getPaymasterData() {
        return await this.paymaster.getPaymasterData(this.cvtcToken);
    }

    /**
     * Get paymaster stub data for gas estimation
     */
    async getPaymasterStubData() {
        return await this.paymaster.getPaymasterStubData(this.cvtcToken);
    }

    /**
     * Calculate token amount needed for gas
     */
    async calculateTokenAmount(gasLimit, gasPrice = 20e9) {
        const estimatedCost = gasLimit * gasPrice;
        const quote = await this.paymaster.getTokenQuote(this.cvtcToken, gasLimit);
        return {
            estimatedCost: ethers.formatEther(estimatedCost.toString()),
            tokenAmount: ethers.formatEther(quote.toString()),
            quote: quote
        };
    }

    /**
     * Check if user has enough tokens
     */
    async checkUserBalance(userAddress, requiredAmount) {
        const tokenContract = new ethers.Contract(
            this.cvtcToken,
            ['function balanceOf(address) view returns (uint256)'],
            this.paymaster.runner.provider
        );

        const balance = await tokenContract.balanceOf(userAddress);
        return {
            hasEnough: balance >= requiredAmount,
            balance: ethers.formatEther(balance),
            required: ethers.formatEther(requiredAmount)
        };
    }
}

export default PaymasterUtils;`;

    // Write utilities file
    const utilsPath = path.join(__dirname, '../../frontend/src/services/paymasterUtils.js');
    fs.writeFileSync(utilsPath, utilsContent);

    console.log('✅ Utilitaires paymaster créés');
    console.log('📄 Fichier:', utilsPath);

    // Update package.json scripts
    const packageJsonPath = path.join(__dirname, '../package.json');
    let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    packageJson.scripts = {
        ...packageJson.scripts,
        "deploy-paymaster": "tsx scripts/deploy-paymaster.ts",
        "test-paymaster": "tsx scripts/test-paymaster.ts",
        "setup-paymaster": "tsx scripts/setup-paymaster-integration.ts"
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    console.log('✅ Scripts npm mis à jour');
    console.log('📄 Fichier:', packageJsonPath);

    console.log('\n🎉 Intégration paymaster terminée!');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Déployer le paymaster: npm run deploy-paymaster');
    console.log('2. Tester le paymaster: npm run test-paymaster');
    console.log('3. Redémarrer l\'application frontend');
    console.log('4. Les transferts utiliseront automatiquement le paymaster CVTC!');
}

// Handle script execution
if (require.main === module) {
    main().catch(console.error);
}

export { main };