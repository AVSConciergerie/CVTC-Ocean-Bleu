import { ethers } from 'ethers';

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
        try {
            console.log('🔍 [VERSION FIX] Appel getPaymasterData avec token:', this.cvtcToken);

            // Vérifier que le contrat est initialisé
            if (!this.paymaster) {
                throw new Error('Contrat paymaster non initialisé');
            }

            console.log('🔍 Contrat paymaster:', this.paymaster.address);
            console.log('🔍 Token CVTC:', this.cvtcToken);

            // Appeler directement la fonction du contrat
            let result;
            try {
                console.log('🔄 Appel this.paymaster.getPaymasterData...');

                // Vérifier que les paramètres sont corrects
                console.log('🔍 Paramètres appel:', {
                    token: this.cvtcToken,
                    paymasterAddress: this.paymaster?.address || 'undefined'
                });

                result = await this.paymaster.getPaymasterData(this.cvtcToken);
                console.log('🔍 Résultat brut du contrat:', result);
                console.log('🔍 Type du résultat:', typeof result);
                console.log('🔍 Longueur du résultat:', result ? result.length : 'null');

                // TRAITEMENT IMMÉDIAT : Gérer les objets avec propriété "data"
                if (result && typeof result === 'object' && result.data && typeof result.data === 'string' && result.data.startsWith('0x')) {
                    console.log('🔄 [TRAITEMENT IMMÉDIAT] Objet avec propriété data détecté');
                    try {
                        const hexData = result.data;
                        if (hexData.length >= 66) {
                            const dataLengthHex = hexData.slice(66, 130);
                            const dataLength = parseInt(dataLengthHex, 16);

                            if (dataLength > 0) {
                                const actualData = hexData.slice(130, 130 + (dataLength * 2));
                                console.log('✅ [TRAITEMENT IMMÉDIAT] Données ABI extraites:', actualData);
                                result = ethers.getBytes('0x' + actualData);
                                console.log('✅ [TRAITEMENT IMMÉDIAT] Conversion réussie en bytes');
                            }
                        }
                    } catch (immediateError) {
                        console.warn('⚠️ [TRAITEMENT IMMÉDIAT] Échec extraction ABI:', immediateError);
                        // Garder le résultat original pour les autres traitements
                    }
                }

            } catch (contractError) {
                console.error('❌ Erreur appel contrat:', contractError);
                console.error('❌ Détails appel:', {
                    message: contractError.message,
                    code: contractError.code,
                    data: contractError.data
                });

                // Essayer avec call statique comme dans le debug
                console.log('🔄 Tentative call statique...');
                try {
                    const callData = this.paymaster.interface.encodeFunctionData("getPaymasterData", [this.cvtcToken]);
                    console.log('🔍 Call data encodé:', callData);

                    const rawResult = await this.paymaster.runner.provider.call({
                        to: this.paymaster.target,
                        data: callData
                    });

                    console.log('🔍 Résultat call statique:', rawResult);
                    result = ethers.hexlify(rawResult);
                    console.log('✅ Conversion hex réussie:', result);

                } catch (staticError) {
                    console.error('❌ Échec call statique:', staticError);

                    // FALLBACK BACKEND : Si tout échoue, utiliser l'API backend
                    console.log('🔄 Tentative fallback backend...');
                    try {
                        const backendResponse = await fetch(`/api/paymaster/data/${this.cvtcToken}`);
                        if (!backendResponse.ok) {
                            throw new Error(`Backend error: ${backendResponse.status}`);
                        }

                        const backendData = await backendResponse.json();
                        if (backendData.success && backendData.data.paymasterData) {
                            console.log('✅ [FALLBACK] Données récupérées depuis backend:', backendData.data.paymasterData);
                            result = backendData.data.paymasterData;
                        } else {
                            throw new Error('Backend returned invalid data');
                        }
                    } catch (backendError) {
                        console.error('❌ Échec fallback backend:', backendError);
                        throw contractError; // Relancer l'erreur originale
                    }
                }
            }

            // CAS 1: Si c'est déjà des bytes valides
            if (result && ethers.isBytesLike(result)) {
                console.log('✅ Données déjà en bytes valides');
                return result;
            }

            // CAS 2: Si c'est une string hex
            if (typeof result === 'string' && result.startsWith('0x')) {
                console.log('🔄 Conversion string hex vers bytes');
                return ethers.getBytes(result);
            }

            // CAS 3: Si c'est un objet avec propriété "data" (cas actuel)
            if (result && typeof result === 'object' && result.data) {
                console.log('🔄 Extraction propriété data:', result.data);
                console.log('🔄 Type de data:', typeof result.data);

                // Vérifier si data est déjà des bytes
                if (ethers.isBytesLike(result.data)) {
                    console.log('✅ Propriété data déjà en bytes');
                    return result.data;
                }

                // Si data est une string hex, la convertir
                if (typeof result.data === 'string' && result.data.startsWith('0x')) {
                    console.log('🔄 Conversion propriété data string vers bytes');

                    // Gestion spéciale pour les données ABI encodées
                    try {
                        // Si c'est des données ABI avec longueur, extraire la partie utile
                        const hexData = result.data;
                        if (hexData.length >= 66) { // 32 bytes (offset) + 32 bytes (longueur) + données
                            // Les 32 premiers bytes sont l'offset (généralement 0x20 = 32)
                            // Les 32 bytes suivants sont la longueur des données
                            const dataLengthHex = hexData.slice(66, 130); // Position 32-64 (en hex: 64-128)
                            const dataLength = parseInt(dataLengthHex, 16);

                            if (dataLength > 0) {
                                // Extraire les données utiles (après la longueur)
                                const actualData = hexData.slice(130, 130 + (dataLength * 2));
                                console.log('🔄 Données ABI extraites:', actualData);
                                return ethers.getBytes('0x' + actualData);
                            }
                        }

                        // Fallback: convertir directement
                        return ethers.getBytes(hexData);
                    } catch (abiError) {
                        console.warn('⚠️ Erreur traitement ABI, fallback direct:', abiError);
                        return ethers.getBytes(result.data);
                    }
                }

                console.log('⚠️ Format de data inattendu:', result.data);
                return ethers.getBytes(result.data);
            }

            // CAS 4: Objet ethers.js avec méthodes
            if (result && typeof result === 'object' && typeof result.toString === 'function') {
                console.log('🔄 Objet ethers, conversion via toString');
                const hexString = result.toString();
                return ethers.getBytes(hexString);
            }

            console.log('⚠️ Format complètement inattendu:', result);
            console.log('⚠️ Tentative de conversion forcée...');

            // Dernière tentative : essayer de convertir n'importe quoi
            try {
                return ethers.getBytes(result);
            } catch (conversionError) {
                console.error('❌ Échec conversion forcée:', conversionError);
                throw new Error(`Format de données paymaster non reconnu: ${typeof result}`);
            }

        } catch (error) {
            console.error('❌ Erreur getPaymasterData:', error);
            console.error('❌ Détails:', {
                message: error.message,
                code: error.code,
                data: error.data
            });
            throw error;
        }
    }

    /**
     * Génère les données stub pour l'estimation du gas
     */
    async getPaymasterStubData() {
        try {
            console.log('🔍 Appel getPaymasterStubData avec token:', this.cvtcToken);

            let result;
            try {
                result = await this.paymaster.getPaymasterStubData(this.cvtcToken);
                console.log('🔍 Résultat brut du stub:', result);

                // TRAITEMENT IMMÉDIAT : Gérer les objets avec propriété "data"
                if (result && typeof result === 'object' && result.data && typeof result.data === 'string' && result.data.startsWith('0x')) {
                    console.log('🔄 [TRAITEMENT IMMÉDIAT STUB] Objet avec propriété data détecté');
                    try {
                        const hexData = result.data;
                        if (hexData.length >= 66) {
                            const dataLengthHex = hexData.slice(66, 130);
                            const dataLength = parseInt(dataLengthHex, 16);

                            if (dataLength > 0) {
                                const actualData = hexData.slice(130, 130 + (dataLength * 2));
                                console.log('✅ [TRAITEMENT IMMÉDIAT STUB] Données ABI extraites:', actualData);
                                result = ethers.getBytes('0x' + actualData);
                                console.log('✅ [TRAITEMENT IMMÉDIAT STUB] Conversion réussie en bytes');
                            }
                        }
                    } catch (immediateError) {
                        console.warn('⚠️ [TRAITEMENT IMMÉDIAT STUB] Échec extraction ABI:', immediateError);
                        // Garder le résultat original pour les autres traitements
                    }
                }
            } catch (contractError) {
                console.error('❌ Erreur appel contrat stub:', contractError);

                // FALLBACK BACKEND pour stub data
                console.log('🔄 Tentative fallback backend pour stub...');
                try {
                    const backendResponse = await fetch(`/api/paymaster/stub/${this.cvtcToken}`);
                    if (!backendResponse.ok) {
                        throw new Error(`Backend stub error: ${backendResponse.status}`);
                    }

                    const backendData = await backendResponse.json();
                    if (backendData.success && backendData.data.paymasterStubData) {
                        console.log('✅ [FALLBACK] Stub data récupérée depuis backend:', backendData.data.paymasterStubData);
                        result = backendData.data.paymasterStubData;
                    } else {
                        throw new Error('Backend returned invalid stub data');
                    }
                } catch (backendError) {
                    console.error('❌ Échec fallback backend stub:', backendError);
                    throw contractError; // Relancer l'erreur originale
                }
            }

            // Même logique améliorée que getPaymasterData
            if (result && ethers.isBytesLike(result)) {
                console.log('✅ StubData déjà en bytes valides');
                return result;
            }

            if (typeof result === 'string' && result.startsWith('0x')) {
                console.log('🔄 Conversion stub string hex vers bytes');
                return ethers.getBytes(result);
            }

            if (result && typeof result === 'object' && result.data) {
                console.log('🔄 Extraction propriété data du stub:', result.data);

                if (ethers.isBytesLike(result.data)) {
                    console.log('✅ Propriété data du stub déjà en bytes');
                    return result.data;
                }

                if (typeof result.data === 'string' && result.data.startsWith('0x')) {
                    console.log('🔄 Conversion propriété data du stub string vers bytes');

                    // Gestion spéciale pour les données ABI encodées
                    try {
                        const hexData = result.data;
                        if (hexData.length >= 66) {
                            const dataLengthHex = hexData.slice(66, 130);
                            const dataLength = parseInt(dataLengthHex, 16);

                            if (dataLength > 0) {
                                const actualData = hexData.slice(130, 130 + (dataLength * 2));
                                console.log('🔄 Données ABI stub extraites:', actualData);
                                return ethers.getBytes('0x' + actualData);
                            }
                        }
                        return ethers.getBytes(hexData);
                    } catch (abiError) {
                        console.warn('⚠️ Erreur traitement ABI stub, fallback direct:', abiError);
                        return ethers.getBytes(result.data);
                    }
                }

                return ethers.getBytes(result.data);
            }

            if (result && typeof result === 'object' && typeof result.toString === 'function') {
                console.log('🔄 Objet ethers stub, conversion via toString');
                const hexString = result.toString();
                return ethers.getBytes(hexString);
            }

            console.log('⚠️ Format stub inattendu, conversion forcée');
            return ethers.getBytes(result);

        } catch (error) {
            console.error('❌ Erreur getPaymasterStubData:', error);
            throw error;
        }
    }

    /**
     * Calcule le coût en CVTC pour une quantité de gas
     */
    async calculateTokenAmount(gasLimit, gasPrice = 20e9) {
        // Convertir en BigInt pour éviter les erreurs de type
        const gasLimitBigInt = BigInt(gasLimit);
        const gasPriceBigInt = BigInt(gasPrice);
        const estimatedCost = gasLimitBigInt * gasPriceBigInt;

        let quote;
        try {
            quote = await this.paymaster.getTokenQuote(this.cvtcToken, gasLimit);

            // TRAITEMENT IMMÉDIAT : Gérer les objets avec propriété "data" pour les quotes
            if (quote && typeof quote === 'object' && quote.data && typeof quote.data === 'string' && quote.data.startsWith('0x')) {
                console.log('🔄 [TRAITEMENT IMMÉDIAT QUOTE] Objet avec propriété data détecté');
                try {
                    const hexData = quote.data;
                    if (hexData.length >= 66) {
                        const dataLengthHex = hexData.slice(66, 130);
                        const dataLength = parseInt(dataLengthHex, 16);

                        if (dataLength > 0) {
                            const actualData = hexData.slice(130, 130 + (dataLength * 2));
                            console.log('✅ [TRAITEMENT IMMÉDIAT QUOTE] Données ABI extraites:', actualData);
                            const bytesData = ethers.getBytes('0x' + actualData);
                            // Pour les quotes, on s'attend à un uint256, donc convertir en BigInt
                            quote = BigInt(ethers.hexlify(bytesData));
                            console.log('✅ [TRAITEMENT IMMÉDIAT QUOTE] Conversion réussie en BigInt');
                        }
                    }
                } catch (immediateError) {
                    console.warn('⚠️ [TRAITEMENT IMMÉDIAT QUOTE] Échec extraction ABI:', immediateError);
                    // Garder le résultat original pour les autres traitements
                }
            }
        } catch (contractError) {
            console.error('❌ Erreur calcul quote contrat:', contractError);

            // FALLBACK BACKEND pour quote
            console.log('🔄 Tentative fallback backend pour quote...');
            try {
                const backendResponse = await fetch(`/api/paymaster/quote/${gasLimit}/${this.cvtcToken}`);
                if (!backendResponse.ok) {
                    throw new Error(`Backend quote error: ${backendResponse.status}`);
                }

                const backendData = await backendResponse.json();
                if (backendData.success && backendData.data.quote) {
                    console.log('✅ [FALLBACK] Quote récupérée depuis backend:', backendData.data.tokenAmount);
                    quote = BigInt(backendData.data.quote);
                } else {
                    throw new Error('Backend returned invalid quote data');
                }
            } catch (backendError) {
                console.error('❌ Échec fallback backend quote:', backendError);
                throw contractError; // Relancer l'erreur originale
            }
        }

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

export default PaymasterUtils;