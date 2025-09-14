import React, { createContext, useContext, useState, useEffect } from 'react';
import { createWalletClient, custom } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, http, formatUnits, encodeFunctionData } from 'viem';
import { bscTestnet } from 'viem/chains';
import { ethers } from 'ethers';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { toSafeSmartAccount } from 'permissionless/accounts';


// Configuration Paymaster BSC Testnet
const PAYMASTER_CONFIG = {
    bscTestnet: {
        chainId: 97,
        rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
        bundlerUrl: "https://api.pimlico.io/v2/binance-testnet/rpc?apikey=YOUR_API_KEY", // Utiliser v2 pour v0.7
        paymasterAddress: "0xa5e6b56FF29a7d0b19946DB836E31D88E41CAdE2", // NOUVEL paymaster corrigé
        entryPointAddress: "0x0000000071727De22E5E9d8BAf0edAc6f37da032", // v0.7 entryPoint
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

// ABI Safe pour vérifier les owners
const SAFE_ABI = [
    "function getOwners() view returns (address[])",
    "function getThreshold() view returns (uint256)"
];

// Constants pour CVTC
const CVTC_TOKEN_ADDRESS = '0x532FC49071656C16311F2f89E6e41C53243355D3';
const CVTC_TOKEN_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "spender", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "to", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];


const PimlicoContext = createContext();

export function PimlicoProvider({ children }) {
    const [smartAccount, setSmartAccount] = useState(null);
    const [smartAccountAddress, setSmartAccountAddress] = useState(null);
    const [account, setAccount] = useState(null);
    const [bundler, setBundler] = useState(null);
    const [isMultiOwner, setIsMultiOwner] = useState(false);
    const [error, setError] = useState(null);
    const [paymaster, setPaymaster] = useState(null);
    const [isInitializing, setIsInitializing] = useState(false);

    const { user, ready, authenticated, signMessage } = usePrivy();
    const { wallets } = useWallets();
    const apiKey = import.meta.env.VITE_PIMLICO_API_KEY;
    console.log('🔑 Pimlico API Key present:', !!apiKey);
    console.log('🔗 Bundler URL will be:', `https://api.pimlico.io/v2/97/rpc?apikey=${apiKey ? '***' + apiKey.slice(-4) : 'MISSING'}`);
    const config = {
        ...PAYMASTER_CONFIG.bscTestnet,
        bundlerUrl: `https://api.pimlico.io/v2/97/rpc?apikey=${apiKey}`
    };

    useEffect(() => {
        initializePaymaster();
    }, []);

    useEffect(() => {
        if (ready && authenticated && user) {
            initializeSmartAccount(signMessage);
        }
    }, [ready, authenticated, user, signMessage]);

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

            // Vérifier si c'est une erreur réseau
            if (err.message.includes('network') || err.message.includes('ERR_INTERNET_DISCONNECTED') || err.code === 'NETWORK_ERROR') {
                setError('Erreur de connexion réseau. Vérifiez votre connexion internet et réessayez.');
            } else {
                setError(`Erreur paymaster: ${err.message}`);
            }
        }
    };

    const initializeSmartAccount = async (signMessageFn) => {
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

            console.log('🔧 Création du Smart Account...');

            console.log('🔑 Adresse wallet Privy:', user.wallet.address);

            // Calculer l'adresse Smart Account prédite pour tous les cas
            const owner = {
                address: user.wallet.address,
                type: 'json-rpc',
                signMessage: async (message) => await signMessageFn({ message }),
                signTransaction: async () => { throw new Error('Not implemented'); },
                signTypedData: async () => { throw new Error('Not implemented'); }
            };

            const predictedAccount = await toSafeSmartAccount({
                client: publicClient,
                owners: [owner],
                entryPoint: {
                    address: config.entryPointAddress,
                    version: "0.7"
                },
                version: "1.4.1"
            });

            console.log('🔮 Adresse Smart Account prédite:', predictedAccount.address);

            // Utiliser l'adresse Smart Account comme adresse principale
            setSmartAccountAddress(predictedAccount.address);

            // Vérifier si l'adresse wallet est un contrat
            const code = await publicClient.getCode({ address: user.wallet.address });
            const isContract = code !== '0x';

            console.log('🔍 User wallet address:', user.wallet.address);
            console.log('🔍 Is contract:', isContract);

            let account = predictedAccount;
            let multiOwner = false;

            // Pour les contrats (smart wallets)
            if (isContract) {
                // Vérifier si c'est un Safe
                try {
                    const safeContract = new ethers.Contract(user.wallet.address, SAFE_ABI, new ethers.JsonRpcProvider(config.rpcUrl));
                    const owners = await safeContract.getOwners();
                    const threshold = await safeContract.getThreshold();

                    console.log('✅ Safe détecté:', { owners: owners.length, threshold });

                    if (threshold === 1) {
                        console.log('🏠 Safe avec seuil 1, utilisation SafeSmartAccount avec paymaster');

                        // Utiliser SafeSmartAccount pour le Safe existant
                        const { SafeSmartAccount } = await import('permissionless/accounts');

                        const owner = {
                            address: user.wallet.address,
                            type: 'json-rpc',
                            signMessage: async (message) => await signMessageFn({ message }),
                            signTransaction: async () => { throw new Error('Not implemented'); },
                            signTypedData: async () => { throw new Error('Not implemented'); }
                        };

                        const account = await SafeSmartAccount({
                            address: user.wallet.address,
                            client: publicClient,
                            owners: [owner],
                            entryPoint: {
                                address: config.entryPointAddress,
                                version: "0.7"
                            },
                            version: "1.4.1"
                        });

                        // Créer le Pimlico client
                        const pimlicoClient = await import('permissionless/clients/pimlico').then(({ createPimlicoClient }) =>
                            createPimlicoClient({
                                transport: http(config.bundlerUrl),
                                entryPoint: {
                                    address: config.entryPointAddress,
                                    version: "0.7",
                                },
                            })
                        );

                        // Créer le Smart Account Client
                        const smartAccountClient = createSmartAccountClient({
                            account,
                            chain: bscTestnet,
                            bundlerTransport: http(config.bundlerUrl),
                            userOperation: {
                                estimateFeesPerGas: async () => {
                                    const gasPrice = await pimlicoClient.getUserOperationGasPrice();
                                    console.log('💰 Gas prices estimés:', gasPrice.fast);
                                    return gasPrice.fast;
                                },
                            },
                            middleware: {
                                sponsorUserOperation: paymaster ? async (userOp) => {
                                    try {
                                        const stubData = await paymaster.getPaymasterStubData(config.cvtcTokenAddress);
                                        console.log('🔧 Paymaster data appliqué:', stubData);
                                        return {
                                            ...userOp,
                                            paymaster: config.paymasterAddress,
                                            paymasterData: stubData,
                                            paymasterVerificationGasLimit: 150000n,
                                            paymasterPostOpGasLimit: 35000n
                                        };
                                    } catch (err) {
                                        console.error('Erreur paymaster middleware:', err);
                                        return userOp;
                                    }
                                } : undefined
                            }
                        });

                        console.log('✅ Smart Account Client pour Safe créé');
                        setSmartAccount(smartAccountClient);
                        setAccount(account);
                        setBundler(pimlicoClient);
                        setIsMultiOwner(false); // Safe 1/1 traité comme EOA

                        // Équilibrage automatique pour Safe existant
                        try {
                            console.log('🔄 Vérification solde Safe pour équilibrage...');
                            const safeBalance = await publicClient.readContract({
                                address: CVTC_TOKEN_ADDRESS,
                                abi: CVTC_TOKEN_ABI,
                                functionName: 'balanceOf',
                                args: [user.wallet.address],
                            });

                            console.log(`💰 Solde Safe: ${formatUnits(safeBalance, 2)} CVTC`);

                            if (safeBalance === 0n) {
                                console.log('ℹ️ Safe sans CVTC, pas d\'équilibrage nécessaire');
                            }
                        } catch (e) {
                            console.warn('⚠️ Erreur vérification solde Safe:', e.message);
                        }

                    } else {
                        console.log('⚠️ Safe multi-owner (seuil >1), utilisation transactions classiques avec crédit');
                        multiOwner = true;
                        setIsMultiOwner(multiOwner);
                        setSmartAccount(null);
                        setAccount(null);
                        setBundler(null);
                    }
                } catch (safeError) {
                    console.log('❌ Contrat détecté mais pas un Safe standard, désactivation ERC-4337');
                    multiOwner = true;
                    setIsMultiOwner(multiOwner);
                    setSmartAccount(null);
                    setAccount(null);
                    setBundler(null);
                }
            } else {
                // Pour EOA, créer le smart account ERC-4337
                setIsMultiOwner(multiOwner);

                // Créer le Pimlico client pour les gas prices
                const pimlicoClient = await import('permissionless/clients/pimlico').then(({ createPimlicoClient }) =>
                    createPimlicoClient({
                        transport: http(config.bundlerUrl),
                        entryPoint: {
                            address: config.entryPointAddress,
                            version: "0.7",
                        },
                    })
                );

                // Créer le Smart Account Client
                const smartAccountClient = createSmartAccountClient({
                    account,
                    chain: bscTestnet,
                    bundlerTransport: http(config.bundlerUrl),
                    userOperation: {
                        estimateFeesPerGas: async () => {
                            const gasPrice = await pimlicoClient.getUserOperationGasPrice();
                            console.log('💰 Gas prices estimés:', gasPrice.fast);
                            return gasPrice.fast;
                        },
                    },
                    middleware: {
                        sponsorUserOperation: paymaster ? async (userOp) => {
                            try {
                                const stubData = await paymaster.getPaymasterStubData(config.cvtcTokenAddress);
                                console.log('🔧 Paymaster data appliqué:', stubData);
                                return {
                                    ...userOp,
                                    paymaster: config.paymasterAddress,
                                    paymasterData: stubData,
                                    paymasterVerificationGasLimit: 150000n,
                                    paymasterPostOpGasLimit: 35000n
                                };
                            } catch (err) {
                                console.error('Erreur paymaster middleware:', err);
                                return userOp; // Retourner l'userOp sans paymaster en cas d'erreur
                            }
                        } : undefined
                    }
                });

                console.log('✅ Smart Account Client créé:', account.address);

                setSmartAccount(smartAccountClient);
                setAccount(account);
                setBundler(pimlicoClient);

            }

            // Équilibrage automatique : transférer 50% des CVTC du wallet vers le Smart Account
            try {
                console.log('🔄 Vérification solde wallet pour équilibrage vers Smart Account...');
                const walletBalance = await publicClient.readContract({
                    address: CVTC_TOKEN_ADDRESS,
                    abi: CVTC_TOKEN_ABI,
                    functionName: 'balanceOf',
                    args: [user.wallet.address],
                });

                const walletBalanceFormatted = formatUnits(walletBalance, 2);
                console.log(`💰 Solde wallet: ${walletBalanceFormatted} CVTC`);

                if (walletBalance > 0n) {
                    // Transférer 50% des CVTC vers le Smart Account
                    const transferAmount = walletBalance / 2n;
                    console.log(`🔄 Transfert automatique de ${formatUnits(transferAmount, 2)} CVTC vers le Smart Account...`);

                    if (!wallets || wallets.length === 0) {
                        console.warn('⚠️ Wallets non disponibles pour le transfert automatique');
                    } else {
                        const ethereumProvider = await wallets[0].getEthereumProvider();
                        const walletClient = createWalletClient({
                            chain: bscTestnet,
                            transport: custom(ethereumProvider),
                        });

                        const [userAddress] = await walletClient.getAddresses();

                        const tx = await walletClient.sendTransaction({
                            account: userAddress,
                            to: CVTC_TOKEN_ADDRESS,
                            data: encodeFunctionData({
                                abi: CVTC_TOKEN_ABI,
                                functionName: 'transfer',
                                args: [smartAccountAddress, transferAmount],
                            }),
                        });

                        console.log('✅ Transfert automatique réussi:', tx);
                        console.log(`💰 ${formatUnits(transferAmount, 2)} CVTC transférés vers le Smart Account`);
                    }
                } else {
                    console.log('ℹ️ Aucun CVTC dans le wallet, pas de transfert nécessaire');
                }
            } catch (transferError) {
                console.warn('⚠️ Erreur lors du transfert automatique:', transferError.message);
                // Ne pas échouer l'initialisation pour ça
            }

            console.log('✅ Smart Account initialisé:', account.address);
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
        account,
        bundler,
        isMultiOwner,
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