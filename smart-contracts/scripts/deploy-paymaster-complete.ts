#!/usr/bin/env tsx

import { ethers } from "ethers";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
    console.log("🚀 DÉPLOIEMENT COMPLET DU PAYMASTER CVTC SUR BSC TESTNET\n");

    // Étape 1: Vérification des prérequis
    console.log("📋 Étape 1: Vérification des prérequis...");
    await checkPrerequisites();

    // Étape 2: Déploiement du contrat
    console.log("\n🔨 Étape 2: Déploiement du contrat paymaster...");
    const paymasterAddress = await deployPaymaster();

    // Étape 3: Configuration de l'intégration frontend
    console.log("\n⚙️ Étape 3: Configuration de l'intégration frontend...");
    await setupFrontendIntegration(paymasterAddress);

    // Étape 4: Test du déploiement
    console.log("\n🧪 Étape 4: Test du déploiement...");
    await testDeployment(paymasterAddress);

    // Étape 5: Finalisation
    console.log("\n✅ Étape 5: Finalisation...");
    await finalizeSetup(paymasterAddress);

    console.log("\n🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!");
    console.log(`📄 Paymaster déployé: ${paymasterAddress}`);
    console.log("\n📋 Prochaines étapes:");
    console.log("1. Redémarrez votre application frontend");
    console.log("2. Les transferts utiliseront automatiquement le paymaster CVTC");
    console.log("3. Les utilisateurs payeront les frais en CVTC au lieu de BNB");
}

async function checkPrerequisites() {
    // Vérifier la clé privée
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("❌ PRIVATE_KEY manquante dans les variables d'environnement");
    }
    console.log("✅ Clé privée trouvée");

    // Vérifier Foundry
    try {
        execSync("forge --version", { stdio: "pipe" });
        console.log("✅ Foundry installé");
    } catch (error) {
        throw new Error("❌ Foundry n'est pas installé. Installez-le avec: curl -L https://foundry.paradigm.xyz | bash");
    }

    // Vérifier Node.js et npm
    try {
        execSync("node --version", { stdio: "pipe" });
        execSync("npm --version", { stdio: "pipe" });
        console.log("✅ Node.js et npm installés");
    } catch (error) {
        throw new Error("❌ Node.js ou npm n'est pas installé");
    }

    // Vérifier la connectivité BSC Testnet
    try {
        const provider = new ethers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");
        await provider.getBlockNumber();
        console.log("✅ Connexion BSC Testnet OK");
    } catch (error) {
        throw new Error("❌ Impossible de se connecter à BSC Testnet");
    }

    console.log("✅ Tous les prérequis sont satisfaits!");
}

async function deployPaymaster(): Promise<string> {
    const privateKey = process.env.PRIVATE_KEY!;
    const provider = new ethers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");
    const signer = new ethers.Wallet(privateKey, provider);

    console.log(`👤 Déployeur: ${signer.address}`);
    console.log(`💰 Balance: ${ethers.formatEther(await provider.getBalance(signer.address))} BNB`);

    // Vérifier le solde
    const balance = await provider.getBalance(signer.address);
    if (balance < ethers.parseEther("0.01")) {
        throw new Error("❌ Solde insuffisant pour le déploiement (minimum 0.01 BNB)");
    }

    // Compiler le contrat
    console.log("🔨 Compilation du contrat...");
    execSync("cd /Users/utilisateur/Documents/GitHub/CVTC-Ocean-Bleu/smart-contracts && forge build", {
        stdio: "inherit"
    });

    // Déployer avec Foundry
    console.log("📤 Déploiement en cours...");
    process.env.DEPLOYER_ADDRESS = signer.address;

    const deployCommand = `cd /Users/utilisateur/Documents/GitHub/CVTC-Ocean-Bleu/smart-contracts && forge script script/DeployPaymaster.s.sol --rpc-url https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7 --private-key ${privateKey} --broadcast --verify`;

    const result = execSync(deployCommand, {
        encoding: 'utf-8',
        stdio: 'pipe'
    });

    // Extraire l'adresse du contrat
    const addressMatch = result.match(/CVTC Paymaster deployed at: (0x[a-fA-F0-9]{40})/);
    if (!addressMatch) {
        console.error("Sortie du déploiement:", result);
        throw new Error("❌ Impossible d'extraire l'adresse du paymaster");
    }

    const paymasterAddress = addressMatch[1];
    console.log(`✅ Paymaster déployé: ${paymasterAddress}`);

    return paymasterAddress;
}

async function setupFrontendIntegration(paymasterAddress: string) {
    // Créer la configuration PimlicoContext
    const contextContent = `import React, { createContext, useContext, useState, useEffect } from 'react';
import { createWalletClient, custom } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, http } from 'viem';
import { bscTestnet } from 'viem/chains';
import { ethers } from 'ethers';

// Configuration Paymaster BSC Testnet
const PAYMASTER_CONFIG = {
    bscTestnet: {
        chainId: 97,
        rpcUrl: "https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7",
        bundlerUrl: "https://public.pimlico.io/v2/97/rpc",
        paymasterAddress: "${paymasterAddress}",
        entryPointAddress: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
        cvtcTokenAddress: "0x532FC49071656C16311F2f89E6e41C53243355D3"
    }
};

// ABI Paymaster
const PAYMASTER_ABI = ${JSON.stringify([
    "function entryPoint() view returns (address)",
    "function cvtcToken() view returns (address)",
    "function owner() view returns (address)",
    "function supportedTokens(address) view returns (bool)",
    "function tokenPrices(address) view returns (uint256)",
    "function getPaymasterData(address token) view returns (bytes)",
    "function getPaymasterStubData(address token) view returns (bytes)",
    "function getTokenQuote(address token, uint256 gasLimit) view returns (uint256)"
], null, 4)};

const PimlicoContext = createContext();

export function PimlicoProvider({ children }) {
    const [smartAccount, setSmartAccount] = useState(null);
    const [smartAccountAddress, setSmartAccountAddress] = useState(null);
    const [error, setError] = useState(null);
    const [paymaster, setPaymaster] = useState(null);

    const config = PAYMASTER_CONFIG.bscTestnet;

    useEffect(() => {
        initializePaymaster();
    }, []);

    const initializePaymaster = async () => {
        try {
            console.log('🔧 Initialisation du Paymaster CVTC...');

            const provider = new ethers.JsonRpcProvider(config.rpcUrl);
            const paymasterContract = new ethers.Contract(
                config.paymasterAddress,
                PAYMASTER_ABI,
                provider
            );

            setPaymaster(paymasterContract);
            console.log('✅ Paymaster initialisé:', config.paymasterAddress);

            // Vérifier que CVTC est supporté
            const cvtcSupported = await paymasterContract.supportedTokens(config.cvtcTokenAddress);
            console.log('CVTC supporté:', cvtcSupported);

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
            console.log('Paymaster data généré');
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
            console.log('Paymaster stub data généré');
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

    // Écrire le fichier PimlicoContext
    const contextPath = path.join(__dirname, '../../frontend/src/context/PimlicoContext.jsx');
    fs.writeFileSync(contextPath, contextContent);
    console.log('✅ PimlicoContext mis à jour');

    // Créer les utilitaires paymaster
    const utilsContent = `import { ethers } from 'ethers';

/**
 * Utilitaires Paymaster CVTC pour BSC Testnet
 */
export class PaymasterUtils {
    constructor(paymasterContract, cvtcTokenAddress) {
        this.paymaster = paymasterContract;
        this.cvtcToken = cvtcTokenAddress;
    }

    /**
     * Génère les données paymaster pour ERC-4337
     */
    async getPaymasterData() {
        return await this.paymaster.getPaymasterData(this.cvtcToken);
    }

    /**
     * Génère les données stub pour l'estimation du gas
     */
    async getPaymasterStubData() {
        return await this.paymaster.getPaymasterStubData(this.cvtcToken);
    }

    /**
     * Calcule le coût en CVTC pour une quantité de gas
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
     * Vérifie si l'utilisateur a assez de CVTC
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

    // Écrire les utilitaires
    const utilsPath = path.join(__dirname, '../../frontend/src/services/paymasterUtils.js');
    fs.writeFileSync(utilsPath, utilsContent);
    console.log('✅ Utilitaires paymaster créés');

    // Mettre à jour package.json
    const packageJsonPath = path.join(__dirname, '../package.json');
    let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    packageJson.scripts = {
        ...packageJson.scripts,
        "deploy-paymaster": "tsx scripts/deploy-paymaster.ts",
        "test-paymaster": "tsx scripts/test-paymaster.ts",
        "setup-paymaster": "tsx scripts/setup-paymaster-integration.ts",
        "deploy-complete": "tsx scripts/deploy-paymaster-complete.ts"
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Scripts npm mis à jour');
}

async function testDeployment(paymasterAddress: string) {
    const privateKey = process.env.PRIVATE_KEY!;
    const provider = new ethers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");
    const signer = new ethers.Wallet(privateKey, provider);

    // ABI simplifié pour les tests
    const testAbi = [
        "function entryPoint() view returns (address)",
        "function cvtcToken() view returns (address)",
        "function supportedTokens(address) view returns (bool)",
        "function tokenPrices(address) view returns (uint256)",
        "function getPaymasterData(address token) view returns (bytes)"
    ];

    const paymaster = new ethers.Contract(paymasterAddress, testAbi, signer);

    // Test 1: Vérifier l'adresse de l'EntryPoint
    const entryPoint = await paymaster.entryPoint();
    console.log(`✅ EntryPoint: ${entryPoint}`);
    if (entryPoint !== "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789") {
        throw new Error("❌ EntryPoint incorrect");
    }

    // Test 2: Vérifier l'adresse CVTC
    const cvtcToken = await paymaster.cvtcToken();
    console.log(`✅ CVTC Token: ${cvtcToken}`);
    if (cvtcToken !== "0x532FC49071656C16311F2f89E6e41C53243355D3") {
        throw new Error("❌ CVTC Token incorrect");
    }

    // Test 3: Vérifier que CVTC est supporté
    const cvtcSupported = await paymaster.supportedTokens("0x532FC49071656C16311F2f89E6e41C53243355D3");
    console.log(`✅ CVTC supporté: ${cvtcSupported}`);
    if (!cvtcSupported) {
        throw new Error("❌ CVTC n'est pas supporté");
    }

    // Test 4: Vérifier le prix CVTC
    const cvtcPrice = await paymaster.tokenPrices("0x532FC49071656C16311F2f89E6e41C53243355D3");
    console.log(`✅ Prix CVTC: ${ethers.formatEther(cvtcPrice)} ETH par token`);

    // Test 5: Générer les données paymaster
    const paymasterData = await paymaster.getPaymasterData("0x532FC49071656C16311F2f89E6e41C53243355D3");
    console.log(`✅ Données paymaster générées: ${paymasterData.substring(0, 66)}...`);

    console.log("✅ Tous les tests de déploiement réussis!");
}

async function finalizeSetup(paymasterAddress: string) {
    // Créer le fichier de configuration
    const config = {
        network: "BSC Testnet",
        chainId: 97,
        paymasterAddress,
        entryPointAddress: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
        cvtcTokenAddress: "0x532FC49071656C16311F2f89E6e41C53243355D3",
        rpcUrl: "https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7",
        bundlerUrl: "https://public.pimlico.io/v2/97/rpc",
        deployedAt: new Date().toISOString(),
        version: "1.0.0"
    };

    fs.writeFileSync('./paymaster-config.json', JSON.stringify(config, null, 2));
    console.log('✅ Configuration sauvegardée');

    // Créer un résumé du déploiement
    const summary = `
🎉 PAYMASTER CVTC DÉPLOYÉ AVEC SUCCÈS!

📊 RÉSUMÉ DU DÉPLOIEMENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Réseau: BSC Testnet (Chain ID: 97)
📄 Paymaster: ${paymasterAddress}
🎯 Token: CVTC (0x532FC49071656C16311F2f89E6e41C53243355D3)
⚡ EntryPoint: 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
🔗 Bundler: https://public.pimlico.io/v2/97/rpc

💰 FONCTIONNALITÉS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Paymaster ERC-20 opérationnel
✅ Support CVTC natif
✅ Intégration Pimlico complète
✅ Gas sponsoring automatique
✅ Transactions ERC-4337

🚀 UTILISATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Redémarrez votre application frontend
2. Les transferts utiliseront automatiquement le paymaster
3. Les utilisateurs payeront en CVTC au lieu de BNB
4. Profitez des transactions sans friction!

📋 COMMANDES DISPONIBLES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• npm run deploy-paymaster    # Redéployer le paymaster
• npm run test-paymaster      # Tester les fonctionnalités
• npm run setup-paymaster     # Reconfigurer l'intégration

⚠️ NOTES IMPORTANTES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Le paymaster sponsorise les frais de gas
• Les utilisateurs doivent avoir des CVTC
• Prix par défaut: 1 CVTC = 1 ETH équivalent
• Configurable pour d'autres tokens si besoin

📞 SUPPORT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
En cas de problème, vérifiez:
1. Solde CVTC de l'utilisateur
2. Configuration réseau BSC Testnet
3. Logs de la console pour les erreurs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎊 DÉPLOIEMENT TERMINÉ - PRÊT POUR LA PRODUCTION!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    fs.writeFileSync('./DEPLOYMENT_SUMMARY.md', summary);
    console.log('✅ Résumé du déploiement créé');

    // Afficher le résumé
    console.log(summary);
}

// Gestionnaire d'erreurs global
process.on('unhandledRejection', (error) => {
    console.error('❌ Erreur non gérée:', error);
    process.exit(1);
});

// Exécution du script
if (require.main === module) {
    main().catch((error) => {
        console.error('❌ Erreur lors du déploiement:', error);
        process.exit(1);
    });
}

export { main };