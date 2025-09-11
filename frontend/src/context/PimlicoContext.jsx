import React, { createContext, useContext, useState, useEffect } from 'react';
import { createWalletClient, custom } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, http } from 'viem';
import { bscTestnet } from 'viem/chains';
import { ethers } from 'ethers';
import { usePrivy } from '@privy-io/react-auth';

// Configuration Paymaster BSC Testnet
const PAYMASTER_CONFIG = {
    bscTestnet: {
        chainId: 97,
        rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
        bundlerUrl: "https://public.pimlico.io/v2/97/rpc",
        paymasterAddress: "0x3853CB8b0F9e2935537734Fd18A74da36dA1a876",
        entryPointAddress: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
        cvtcTokenAddress: "0x532FC49071656C16311F2f89E6e41C53243355D3"
    }
};

// ABI Paymaster
const PAYMASTER_ABI = [
    "function entryPoint() view returns (address)",
    "function cvtcToken() view returns (address)",
    "function owner() view returns (address)",
    "function supportedTokens(address) view returns (bool)",
    "function tokenPrices(address) view returns (uint256)",
    "function getPaymasterData(address token) view returns (bytes)",
    "function getPaymasterStubData(address token) view returns (bytes)",
    "function getTokenQuote(address token, uint256 gasLimit) view returns (uint256)"
];

const PimlicoContext = createContext();

export function PimlicoProvider({ children }) {
    const [smartAccount, setSmartAccount] = useState(null);
    const [smartAccountAddress, setSmartAccountAddress] = useState(null);
    const [error, setError] = useState(null);
    const [paymaster, setPaymaster] = useState(null);
    const [isInitializing, setIsInitializing] = useState(false);

    const { user, ready, authenticated } = usePrivy();
    const config = PAYMASTER_CONFIG.bscTestnet;

    useEffect(() => {
        initializePaymaster();
    }, []);

    useEffect(() => {
        if (ready && authenticated && user) {
            initializeSmartAccount();
        }
    }, [ready, authenticated, user]);

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
            setError(`Erreur paymaster: ${err.message}`);
        }
    };

    const initializeSmartAccount = async () => {
        if (isInitializing) return;
        setIsInitializing(true);

        try {
            console.log('🏦 Initialisation du Smart Account...');

            // Importer les dépendances permissionless disponibles
            console.log('📦 Import des dépendances permissionless...');
            const { createSmartAccountClient } = await import('permissionless');

            console.log('✅ Dépendances importées');

            // Créer le public client
            const publicClient = createPublicClient({
                transport: http(config.rpcUrl),
                chain: bscTestnet
            });

            console.log('🔧 Création du Smart Account avec adresse unique...');

            // Créer une adresse de Smart Account unique dérivée du wallet
            // Utilisation du hash pour créer une adresse déterministe
            const { keccak256, encodePacked } = await import('viem');
            const smartAccountAddress = `0x${keccak256(
                encodePacked(['address', 'string'], [user.wallet.address, 'CVTC-SMART-ACCOUNT'])
            ).slice(26)}`; // Prendre les 20 derniers bytes pour une adresse Ethereum

            console.log('🔑 Adresse wallet Privy:', user.wallet.address);
            console.log('🏦 Adresse Smart Account dérivée:', smartAccountAddress);

            // Créer le Smart Account Client avec paymaster intégré
            const smartAccountClient = createSmartAccountClient({
                account: {
                    address: smartAccountAddress,
                    type: "simple"
                },
                chain: bscTestnet,
                bundlerTransport: http(config.bundlerUrl),
                paymaster: paymaster ? {
                    getPaymasterStubData: async () => {
                        try {
                            const stubData = await paymaster.getPaymasterStubData(config.cvtcTokenAddress);
                            return {
                                paymaster: config.paymasterAddress,
                                paymasterData: stubData,
                                paymasterVerificationGasLimit: 150000n,
                                paymasterPostOpGasLimit: 35000n
                            };
                        } catch (err) {
                            console.error('Erreur paymaster stub data:', err);
                            return null;
                        }
                    }
                } : undefined,
                userOperation: {
                    estimateFeesPerGas: async () => {
                        // Fallback pour l'estimation des frais
                        return {
                            maxFeePerGas: 20000000000n, // 20 gwei
                            maxPriorityFeePerGas: 2000000000n // 2 gwei
                        };
                    }
                }
            });

            console.log('✅ Smart Account Client créé:', smartAccountAddress);

            setSmartAccount(smartAccountClient);
            setSmartAccountAddress(smartAccountAddress);

            console.log('✅ Smart Account initialisé:', smartAccountAddress);
            console.log('🔗 Wallet Address:', user.wallet.address);
            console.log('💰 Paymaster intégré:', !!paymaster);

        } catch (err) {
            console.error('❌ Erreur initialisation Smart Account:', err);
            console.error('Détails:', err);
            setError(`Erreur Smart Account: ${err.message}`);
        } finally {
            setIsInitializing(false);
        }
    };

    // Fonction de diagnostic pour déboguer
    const diagnoseInitialization = () => {
        console.log('🔍 Diagnostic Smart Account:');
        console.log('- Privy ready:', ready);
        console.log('- User authenticated:', authenticated);
        console.log('- User wallet:', user?.wallet?.address);
        console.log('- Paymaster initialized:', !!paymaster);
        console.log('- Is initializing:', isInitializing);
        console.log('- Smart account address:', smartAccountAddress);
        console.log('- Error:', error);
    };

    // Exposer la fonction de diagnostic
    useEffect(() => {
        window.diagnoseSmartAccount = diagnoseInitialization;
    }, [ready, authenticated, user, paymaster, isInitializing, smartAccountAddress, error]);

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
            console.log(`Quote pour ${gasLimit} gas: ${ethers.formatEther(quote)} CVTC`);
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
        isInitializing,
        getPaymasterData,
        getPaymasterStubData,
        getTokenQuote,
        diagnoseInitialization
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

export default PimlicoContext;