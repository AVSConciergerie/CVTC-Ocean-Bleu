import express from 'express';
import { ethers } from 'ethers';

const router = express.Router();

// Configuration Paymaster BSC Testnet
const PAYMASTER_CONFIG = {
    bscTestnet: {
        chainId: 97,
        rpcUrl: "https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7",
        paymasterAddress: "0x950c9E7ea88beF525E5fFA072E7F092E2B0f7516",
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
    "function getTokenQuote(address token, uint256 gasLimit) view returns (uint256)",
    "function getUserDebt(address user) view returns (uint256, uint256, uint256, bool)",
    "function checkAndProcessReimbursement(address user)",
    "function batchProcessReimbursements(address[] users)",
    "function manualReimbursement(address user, uint256 cvtcAmount, uint256 bnbAmount)",
    "function userDebts(address) view returns (uint256, uint256, uint256, bool)"
];

// Cache pour éviter les appels répétés
let paymasterContract = null;
let provider = null;

function getPaymasterContract() {
    if (!paymasterContract) {
        provider = new ethers.JsonRpcProvider(PAYMASTER_CONFIG.bscTestnet.rpcUrl);
        paymasterContract = new ethers.Contract(
            PAYMASTER_CONFIG.bscTestnet.paymasterAddress,
            PAYMASTER_ABI,
            provider
        );
    }
    return paymasterContract;
}

/**
 * GET /api/paymaster/data/:tokenAddress?
 * Récupère les données paymaster pour ERC-4337
 */
router.get('/data/:tokenAddress?', async (req, res) => {
    try {
        const tokenAddress = req.params.tokenAddress || PAYMASTER_CONFIG.bscTestnet.cvtcTokenAddress;

        console.log('🔍 [BACKEND] Récupération données paymaster pour token:', tokenAddress);

        const paymaster = getPaymasterContract();

        // Vérifier que le token est supporté
        const isSupported = await paymaster.supportedTokens(tokenAddress);
        if (!isSupported) {
            return res.status(400).json({
                error: 'Token not supported by paymaster',
                token: tokenAddress
            });
        }

        // Récupérer les données paymaster
        const paymasterData = await paymaster.getPaymasterData(tokenAddress);

        console.log('✅ [BACKEND] Données paymaster récupérées:', {
            token: tokenAddress,
            dataType: typeof paymasterData,
            dataLength: paymasterData ? paymasterData.length : 'null'
        });

        // Convertir en format utilisable par le frontend
        let formattedData;
        if (ethers.isBytesLike(paymasterData)) {
            formattedData = ethers.hexlify(paymasterData);
        } else if (typeof paymasterData === 'string' && paymasterData.startsWith('0x')) {
            // Gestion spéciale pour les données ABI encodées
            try {
                const hexData = paymasterData;
                if (hexData.length >= 66) { // 32 bytes (offset) + 32 bytes (longueur) + données
                    // Les 32 premiers bytes sont l'offset (généralement 0x20 = 32)
                    // Les 32 bytes suivants sont la longueur des données
                    const dataLengthHex = hexData.slice(66, 130); // Position 32-64 (en hex: 64-128)
                    const dataLength = parseInt(dataLengthHex, 16);

                    if (dataLength > 0) {
                        // Extraire les données utiles (après la longueur)
                        const actualData = hexData.slice(130, 130 + (dataLength * 2));
                        console.log('✅ [BACKEND] Données ABI extraites:', actualData);
                        formattedData = '0x' + actualData;
                    } else {
                        formattedData = hexData;
                    }
                } else {
                    formattedData = hexData;
                }
            } catch (abiError) {
                console.warn('⚠️ [BACKEND] Erreur traitement ABI, utilisation directe:', abiError);
                formattedData = paymasterData;
            }
        } else {
            // Essayer de convertir
            try {
                formattedData = ethers.hexlify(paymasterData);
            } catch (conversionError) {
                console.error('❌ [BACKEND] Erreur conversion données:', conversionError);
                return res.status(500).json({
                    error: 'Failed to format paymaster data',
                    details: conversionError.message
                });
            }
        }

        res.json({
            success: true,
            data: {
                paymasterData: formattedData,
                tokenAddress: tokenAddress,
                paymasterAddress: PAYMASTER_CONFIG.bscTestnet.paymasterAddress,
                timestamp: Date.now()
            }
        });

    } catch (error) {
        console.error('❌ [BACKEND] Erreur récupération données paymaster:', error);
        res.status(500).json({
            error: 'Failed to get paymaster data',
            details: error.message,
            token: req.params.tokenAddress
        });
    }
});

/**
 * GET /api/paymaster/stub/:tokenAddress?
 * Récupère les données stub paymaster pour l'estimation
 */
router.get('/stub/:tokenAddress?', async (req, res) => {
    try {
        const tokenAddress = req.params.tokenAddress || PAYMASTER_CONFIG.bscTestnet.cvtcTokenAddress;

        console.log('🔍 [BACKEND] Récupération données stub paymaster pour token:', tokenAddress);

        const paymaster = getPaymasterContract();

        // Récupérer les données stub
        const stubData = await paymaster.getPaymasterStubData(tokenAddress);

        console.log('✅ [BACKEND] Données stub récupérées:', {
            token: tokenAddress,
            dataType: typeof stubData,
            dataLength: stubData ? stubData.length : 'null'
        });

        // Convertir en format utilisable
        let formattedData;
        if (ethers.isBytesLike(stubData)) {
            formattedData = ethers.hexlify(stubData);
        } else if (typeof stubData === 'string' && stubData.startsWith('0x')) {
            // Gestion spéciale pour les données ABI encodées
            try {
                const hexData = stubData;
                if (hexData.length >= 66) {
                    const dataLengthHex = hexData.slice(66, 130);
                    const dataLength = parseInt(dataLengthHex, 16);

                    if (dataLength > 0) {
                        const actualData = hexData.slice(130, 130 + (dataLength * 2));
                        console.log('✅ [BACKEND] Données ABI stub extraites:', actualData);
                        formattedData = '0x' + actualData;
                    } else {
                        formattedData = hexData;
                    }
                } else {
                    formattedData = hexData;
                }
            } catch (abiError) {
                console.warn('⚠️ [BACKEND] Erreur traitement ABI stub, utilisation directe:', abiError);
                formattedData = stubData;
            }
        } else {
            try {
                formattedData = ethers.hexlify(stubData);
            } catch (conversionError) {
                console.error('❌ [BACKEND] Erreur conversion stub:', conversionError);
                return res.status(500).json({
                    error: 'Failed to format stub data',
                    details: conversionError.message
                });
            }
        }

        res.json({
            success: true,
            data: {
                paymasterStubData: formattedData,
                tokenAddress: tokenAddress,
                paymasterAddress: PAYMASTER_CONFIG.bscTestnet.paymasterAddress,
                timestamp: Date.now()
            }
        });

    } catch (error) {
        console.error('❌ [BACKEND] Erreur récupération données stub:', error);
        res.status(500).json({
            error: 'Failed to get paymaster stub data',
            details: error.message,
            token: req.params.tokenAddress
        });
    }
});

/**
 * GET /api/paymaster/quote/:gasLimit/:tokenAddress?
 * Calcule le coût en tokens pour une limite de gas donnée
 */
router.get('/quote/:gasLimit/:tokenAddress?', async (req, res) => {
    try {
        const gasLimit = parseInt(req.params.gasLimit);
        const tokenAddress = req.params.tokenAddress || PAYMASTER_CONFIG.bscTestnet.cvtcTokenAddress;

        if (isNaN(gasLimit) || gasLimit <= 0) {
            return res.status(400).json({
                error: 'Invalid gas limit',
                gasLimit: req.params.gasLimit
            });
        }

        console.log('🔍 [BACKEND] Calcul quote pour gasLimit:', gasLimit, 'token:', tokenAddress);

        const paymaster = getPaymasterContract();

        // Calculer la quote
        const quote = await paymaster.getTokenQuote(tokenAddress, gasLimit);

        console.log('✅ [BACKEND] Quote calculée:', ethers.formatEther(quote), 'tokens');

        res.json({
            success: true,
            data: {
                gasLimit: gasLimit,
                tokenAmount: ethers.formatEther(quote),
                quote: quote.toString(),
                tokenAddress: tokenAddress,
                timestamp: Date.now()
            }
        });

    } catch (error) {
        console.error('❌ [BACKEND] Erreur calcul quote:', error);
        res.status(500).json({
            error: 'Failed to calculate token quote',
            details: error.message,
            gasLimit: req.params.gasLimit,
            token: req.params.tokenAddress
        });
    }
});

/**
 * GET /api/paymaster/status
 * Vérifie le statut du paymaster et des tokens supportés
 */
router.get('/status', async (req, res) => {
    try {
        console.log('🔍 [BACKEND] Vérification statut paymaster');

        const paymaster = getPaymasterContract();
        const config = PAYMASTER_CONFIG.bscTestnet;

        // Vérifier la connectivité
        const owner = await paymaster.owner();
        const cvtcSupported = await paymaster.supportedTokens(config.cvtcTokenAddress);

        // Tester un appel simple
        let testData = null;
        try {
            testData = await paymaster.getPaymasterData(config.cvtcTokenAddress);
        } catch (testError) {
            console.warn('⚠️ [BACKEND] Test paymaster data échoué:', testError.message);
        }

        res.json({
            success: true,
            data: {
                paymasterAddress: config.paymasterAddress,
                cvtcTokenAddress: config.cvtcTokenAddress,
                owner: owner,
                cvtcSupported: cvtcSupported,
                testDataSuccessful: testData !== null,
                rpcUrl: config.rpcUrl,
                chainId: config.chainId,
                timestamp: Date.now()
            }
        });

    } catch (error) {
        console.error('❌ [BACKEND] Erreur vérification statut:', error);
        res.status(500).json({
            error: 'Failed to check paymaster status',
            details: error.message
        });
    }
});

/**
 * GET /api/paymaster/debt/:userAddress
 * Récupère les informations de dette d'un utilisateur
 */
router.get('/debt/:userAddress', async (req, res) => {
    try {
        const userAddress = req.params.userAddress;

        if (!ethers.isAddress(userAddress)) {
            return res.status(400).json({
                error: 'Invalid user address',
                address: userAddress
            });
        }

        console.log('🔍 [BACKEND] Récupération dette utilisateur:', userAddress);

        const paymaster = getPaymasterContract();

        // Récupérer les informations de dette
        const debtInfo = await paymaster.getUserDebt(userAddress);

        console.log('✅ [BACKEND] Dette récupérée:', {
            user: userAddress,
            cvtcOwed: ethers.formatEther(debtInfo[0]),
            bnbOwed: ethers.formatEther(debtInfo[1]),
            lastUpdate: new Date(Number(debtInfo[2]) * 1000).toISOString(),
            isActive: debtInfo[3]
        });

        res.json({
            success: true,
            data: {
                userAddress: userAddress,
                cvtcOwed: debtInfo[0].toString(),
                cvtcOwedFormatted: ethers.formatEther(debtInfo[0]),
                bnbOwed: debtInfo[1].toString(),
                bnbOwedFormatted: ethers.formatEther(debtInfo[1]),
                lastUpdate: debtInfo[2].toString(),
                lastUpdateFormatted: new Date(Number(debtInfo[2]) * 1000).toISOString(),
                isActive: debtInfo[3],
                totalOwed: (debtInfo[0] + debtInfo[1]).toString(),
                totalOwedFormatted: ethers.formatEther(debtInfo[0] + debtInfo[1]),
                timestamp: Date.now()
            }
        });

    } catch (error) {
        console.error('❌ [BACKEND] Erreur récupération dette:', error);
        res.status(500).json({
            error: 'Failed to get user debt',
            details: error.message,
            user: req.params.userAddress
        });
    }
});

/**
 * POST /api/paymaster/reimbursement/:userAddress
 * Déclenche le processus de remboursement pour un utilisateur
 */
router.post('/reimbursement/:userAddress', async (req, res) => {
    try {
        const userAddress = req.params.userAddress;

        if (!ethers.isAddress(userAddress)) {
            return res.status(400).json({
                error: 'Invalid user address',
                address: userAddress
            });
        }

        console.log('🔄 [BACKEND] Déclenchement remboursement pour:', userAddress);

        const paymaster = getPaymasterContract();

        // Créer un wallet pour signer la transaction (nécessaire pour les appels non-view)
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || "0x" + "0".repeat(64), provider);

        // Connecter le contrat au wallet
        const paymasterWithSigner = paymaster.connect(wallet);

        // Déclencher le remboursement
        const tx = await paymasterWithSigner.checkAndProcessReimbursement(userAddress);
        await tx.wait();

        console.log('✅ [BACKEND] Remboursement traité:', {
            user: userAddress,
            txHash: tx.hash
        });

        // Récupérer les nouvelles informations de dette
        const debtInfo = await paymaster.getUserDebt(userAddress);

        res.json({
            success: true,
            data: {
                userAddress: userAddress,
                transactionHash: tx.hash,
                cvtcOwed: debtInfo[0].toString(),
                bnbOwed: debtInfo[1].toString(),
                isActive: debtInfo[3],
                timestamp: Date.now()
            }
        });

    } catch (error) {
        console.error('❌ [BACKEND] Erreur remboursement:', error);
        res.status(500).json({
            error: 'Failed to process reimbursement',
            details: error.message,
            user: req.params.userAddress
        });
    }
});

/**
 * POST /api/paymaster/batch-reimbursement
 * Traite les remboursements pour plusieurs utilisateurs
 */
router.post('/batch-reimbursement', async (req, res) => {
    try {
        const { userAddresses } = req.body;

        if (!Array.isArray(userAddresses) || userAddresses.length === 0) {
            return res.status(400).json({
                error: 'Invalid user addresses array'
            });
        }

        // Valider toutes les adresses
        for (const address of userAddresses) {
            if (!ethers.isAddress(address)) {
                return res.status(400).json({
                    error: 'Invalid user address in array',
                    address: address
                });
            }
        }

        console.log('🔄 [BACKEND] Déclenchement remboursement batch pour:', userAddresses.length, 'utilisateurs');

        const paymaster = getPaymasterContract();
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY || "0x" + "0".repeat(64), provider);
        const paymasterWithSigner = paymaster.connect(wallet);

        // Traiter le remboursement batch
        const tx = await paymasterWithSigner.batchProcessReimbursements(userAddresses);
        await tx.wait();

        console.log('✅ [BACKEND] Remboursement batch traité:', {
            userCount: userAddresses.length,
            txHash: tx.hash
        });

        res.json({
            success: true,
            data: {
                userCount: userAddresses.length,
                userAddresses: userAddresses,
                transactionHash: tx.hash,
                timestamp: Date.now()
            }
        });

    } catch (error) {
        console.error('❌ [BACKEND] Erreur remboursement batch:', error);
        res.status(500).json({
            error: 'Failed to process batch reimbursement',
            details: error.message
        });
    }
});

/**
 * GET /api/paymaster/reimbursement-status
 * Vérifie le statut général des remboursements
 */
router.get('/reimbursement-status', async (req, res) => {
    try {
        console.log('🔍 [BACKEND] Vérification statut remboursements');

        const paymaster = getPaymasterContract();

        // Récupérer les soldes du paymaster
        const cvtcBalance = await provider.getBalance(PAYMASTER_CONFIG.bscTestnet.paymasterAddress);
        const bnbBalance = await provider.getBalance(PAYMASTER_CONFIG.bscTestnet.paymasterAddress);

        // Note: Pour récupérer le solde CVTC, il faudrait connaître l'ABI du token CVTC
        // Pour l'instant, on retourne juste les informations disponibles

        res.json({
            success: true,
            data: {
                paymasterAddress: PAYMASTER_CONFIG.bscTestnet.paymasterAddress,
                bnbBalance: bnbBalance.toString(),
                bnbBalanceFormatted: ethers.formatEther(bnbBalance),
                reimbursementCheckInterval: "3600", // 1 heure en secondes
                timestamp: Date.now()
            }
        });

    } catch (error) {
        console.error('❌ [BACKEND] Erreur vérification statut remboursements:', error);
        res.status(500).json({
            error: 'Failed to check reimbursement status',
            details: error.message
        });
    }
});

export default router;