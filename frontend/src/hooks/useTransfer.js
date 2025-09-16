import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { createWalletClient, custom } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { encodeFunctionData, parseUnits, formatUnits } from 'viem';
import { createPublicClient, http } from 'viem';
import { bscTestnet } from 'viem/chains';
import PaymasterUtils from '../services/paymasterUtils';

// Constants
const CVTC_TOKEN_ADDRESS = '0x532fc49071656c16311f2f89e6e41c53243355d3';
const PAYMASTER_ADDRESS = '0xa5e6b56FF29a7d0b19946DB836E31D88E41CAdE2';

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

const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http('https://data-seed-prebsc-1-s1.binance.org:8545/'),
});

export const useTransfer = (smartAccount, smartAccountAddress, wallets, isMultiOwner, bundler, config, account) => {
  const [currentAddress, setCurrentAddress] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('unique');
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [paymasterUtils, setPaymasterUtils] = useState(null);

  useEffect(() => {
    if (smartAccountAddress) {
      const ethersProvider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
      const paymasterContract = new ethers.Contract(
        PAYMASTER_ADDRESS,
        [
          'function getPaymasterData(address) view returns (bytes)',
          'function getPaymasterStubData(address) view returns (bytes)',
          'function getTokenQuote(address, uint256) view returns (uint256)',
          'function supportedTokens(address) view returns (bool)'
        ],
        ethersProvider
      );
      console.log('🔧 Contrat paymaster initialisé avec provider ethers:', PAYMASTER_ADDRESS);
      const utils = new PaymasterUtils(paymasterContract, CVTC_TOKEN_ADDRESS);
      setPaymasterUtils(utils);
    }
  }, [smartAccountAddress]);

  const handleAddRecipient = () => {
    console.log('📋 handleAddRecipient appelé');
    console.log('  - currentAddress:', currentAddress);
    console.log('  - smartAccountAddress:', smartAccountAddress);
    console.log('  - recipients actuels:', recipients);

    if (currentAddress && !recipients.includes(currentAddress)) {
      if (currentAddress.toLowerCase() === CVTC_TOKEN_ADDRESS.toLowerCase()) {
        console.log('❌ Adresse token CVTC détectée');
        setError("Vous ne pouvez pas utiliser l'adresse du token CVTC comme destinataire");
        return;
      }

      if (currentAddress.toLowerCase() === smartAccountAddress?.toLowerCase()) {
        console.log('🚨 AVERTISSEMENT: Ajout de l\'adresse du smart account comme destinataire!');
        console.log('  Cela pourrait causer des problèmes de transfert');
      }

      console.log('✅ Ajout destinataire:', currentAddress);
      setRecipients([...recipients, currentAddress]);
      setCurrentAddress('');
    } else {
      console.log('⚠️ Condition non remplie');
      console.log('  - currentAddress défini:', !!currentAddress);
      console.log('  - currentAddress vide:', currentAddress === '');
      console.log('  - Déjà dans recipients:', recipients.includes(currentAddress));
    }
  };

  const handleRemoveRecipient = (addressToRemove) => {
    setRecipients(recipients.filter(address => address !== addressToRemove));
  };

  const handleReset = () => {
    setCurrentAddress('');
    setRecipients([]);
    setAmount('');
    setFrequency('unique');
    setTxHash(null);
    setError(null);
  };

  const checkBalance = useCallback(async () => {
    // Utiliser smartAccountAddress si disponible, sinon utiliser l'adresse wallet
    const addressToCheck = smartAccountAddress || (wallets && wallets.length > 0 ? wallets[0].address : null);

    if (!addressToCheck) {
      setError("Adresse non disponible pour vérifier le solde");
      return;
    }
    setIsLoadingBalance(true);
    setError(null);
    try {
      const balanceResult = await publicClient.readContract({
        address: CVTC_TOKEN_ADDRESS,
        abi: CVTC_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [addressToCheck],
      });
      const formattedBalance = formatUnits(balanceResult, 2);
      setBalance(formattedBalance);
      console.log(`💰 Solde CVTC mis à jour: ${formattedBalance} CVTC pour ${addressToCheck}`);
    } catch (err) {
      console.error('Erreur vérification solde:', err);
      setBalance('0.000000');
      setError(`Erreur de vérification du solde: ${err.message}`);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [smartAccountAddress, wallets]);

  const validatePrivyAuth = useCallback(() => {
    // This needs to be passed from component or use Privy hook here
    // For now, assume it's valid
    return { valid: true, message: "Authentification valide" };
  }, []);

  const handleSend = useCallback(async () => {
    setError(null);
    setTxHash(null);

    const authValidation = validatePrivyAuth();
    if (!authValidation.valid) {
      setError(`Erreur d'authentification: ${authValidation.message}`);
      return;
    }

    // Vérifier les conditions de base
    if (recipients.length === 0 || !amount || parseFloat(amount) <= 0) {
      const errorMsg = recipients.length === 0 ? "destinataire manquant" :
                      !amount || parseFloat(amount) <= 0 ? "montant invalide" : "erreur inconnue";
      setError(`Veuillez vérifier les informations : ${errorMsg}.`);
      return;
    }

    // Pour les wallets EOA, permettre les transferts classiques
    if (!smartAccount && !isMultiOwner) {
      console.log('🔄 Utilisation des transferts classiques pour wallet EOA');
      // C'est OK, on continue avec les transferts classiques
    }

    if (balance !== null && parseFloat(amount) > parseFloat(balance)) {
      setError(`Solde insuffisant. Disponible: ${balance} CVTC, Demandé: ${amount} CVTC`);
      return;
    }

    // Bloquer les transferts planifiés non implémentés
    if (frequency !== 'unique') {
      setError("La fonctionnalité de transfert planifié n'est pas encore disponible.");
      return;
    }

    setIsSending(true);
    try {
      console.log('💰 Montant saisi:', amount);
      console.log('👥 Destinataires:', recipients);
      console.log('🏠 Smart Account Address:', smartAccountAddress);
      console.log('🔑 Is Multi Owner:', isMultiOwner);
      console.log('💼 Smart Account disponible:', !!smartAccount);

      const amountInWei = parseUnits(amount, 2);
      console.log('🔢 Montant en wei:', amountInWei.toString());

      if (frequency === 'unique') {
        if (smartAccount) {
          console.log('🚀 Exécution de vraies transactions sur BSC Testnet avec paymaster ERC-4337...');
        } else {
          console.log('🚀 Exécution de vraies transactions sur BSC Testnet classiques...');
        }

        if (isMultiOwner || !smartAccount) {
          console.log('🔄 Utilisation de transactions classiques (EOA ou fallback)');
          console.log('🔍 DEBUG: Vérification avant transfert classique');
          console.log('  - recipients:', recipients);
          console.log('  - smartAccountAddress:', smartAccountAddress);
          console.log('  - currentAddress:', currentAddress);

          if (!wallets || wallets.length === 0) throw new Error('Wallet Privy non disponible');

          const ethereumProvider = await wallets[0].getEthereumProvider();
          const walletClient = createWalletClient({ chain: bscTestnet, transport: custom(ethereumProvider) });
          const [userAddress] = await walletClient.getAddresses();

          const txHashes = [];
          console.log('📤 Adresse expéditeur (classique):', userAddress);
          console.log('🔍 Vérification destinataires vs smart account:');
          recipients.forEach((recipient, index) => {
            console.log(`  Destinataire ${index + 1}: ${recipient}`);
            console.log(`  Est smart account? ${recipient.toLowerCase() === smartAccountAddress?.toLowerCase()}`);
            if (recipient.toLowerCase() === smartAccountAddress?.toLowerCase()) {
              console.log('🚨 PROBLÈME DÉTECTÉ: Le destinataire est l\'adresse du smart account!');
              console.log('  - Destinataire:', recipient);
              console.log('  - Smart Account:', smartAccountAddress);
            }
          });

          for (const recipient of recipients) {
            console.log('📥 Destinataire traité:', recipient);
            console.log('💸 Montant à envoyer:', amountInWei.toString());

            if (recipient.toLowerCase() === smartAccountAddress?.toLowerCase()) {
              console.log('🚨 ALERTE: Transaction vers smart account détectée!');
              console.log('  Cette transaction va au smart account au lieu du destinataire réel');
              console.log('  Vérifiez la logique d\'ajout de destinataires');
            }
            // Utiliser Privy pour envoyer la transaction ERC-20
            console.log('🔄 Envoi via Privy wallet...');

            const transactionData = encodeFunctionData({
              abi: CVTC_TOKEN_ABI,
              functionName: 'transfer',
              args: [recipient, amountInWei],
            });

            console.log('📋 Données de transaction préparées:');
            console.log('  - To:', CVTC_TOKEN_ADDRESS);
            console.log('  - Data:', transactionData);
            console.log('  - Value: 0');

            // Utiliser directement l'ethereum provider de Privy
            const ethereumProvider = await wallets[0].getEthereumProvider();

            console.log('🔑 Provider Privy obtenu');

            // Préparer la transaction pour Privy
            const transactionRequest = {
              to: CVTC_TOKEN_ADDRESS,
              data: transactionData,
              value: '0x0', // 0 en hexadécimal
              gasLimit: '0x186A0', // 100000 en hexadécimal (gas estimé)
            };

            console.log('📋 Transaction préparée pour Privy:', transactionRequest);

            // Envoyer via l'API Ethereum standard de Privy
            const txHash = await ethereumProvider.request({
              method: 'eth_sendTransaction',
              params: [transactionRequest],
            });

            console.log('✅ Transaction envoyée via Privy:', txHash);
            const tx = txHash;
            txHashes.push(tx);
            console.log(`✅ Transaction classique envoyée: ${tx}`);
          }
          setTxHash(txHashes[0]);
          setTimeout(() => checkBalance(), 5000);

        } else {
          if (!paymasterUtils) {
            setError('Paymaster non initialisé. Veuillez réessayer.');
            setIsSending(false);
            return;
          }

          let paymasterQuote;
          try {
            const gasEstimate = 100000n;
            paymasterQuote = await paymasterUtils.calculateTokenAmount(gasEstimate);
            if (!isMultiOwner) {
              const balanceCheck = await paymasterUtils.checkUserBalance(smartAccountAddress, paymasterQuote.quote);
              if (!balanceCheck.hasEnough) {
                setError(`Solde CVTC insuffisant pour les frais de gas. Disponible: ${balanceCheck.balance} CVTC, Besoin: ${balanceCheck.required} CVTC`);
                setIsSending(false);
                return;
              }
            }
          } catch (quoteError) {
            console.warn('⚠️ Impossible de calculer les frais de gas:', quoteError);
          }

          try {
            if (!smartAccount) throw new Error('Smart account non disponible. Veuillez vous reconnecter.');

            console.log('🚀 Préparation transferts ERC-4337');
            console.log('📤 Smart Account:', smartAccountAddress);
            console.log('🔍 Vérification destinataires ERC-4337 vs smart account:');
            recipients.forEach((recipient, index) => {
              console.log(`  Destinataire ERC-4337 ${index + 1}: ${recipient}`);
              console.log(`  Est smart account? ${recipient.toLowerCase() === smartAccountAddress?.toLowerCase()}`);
            });

            const transferCalls = recipients.map((recipient) => {
              console.log('📥 Destinataire ERC-4337 traité:', recipient);
              return {
                to: CVTC_TOKEN_ADDRESS,
                data: encodeFunctionData({
                  abi: CVTC_TOKEN_ABI,
                  functionName: 'transfer',
                  args: [recipient, amountInWei],
                }),
                value: 0n,
              };
            });

            let allCalls = [...transferCalls];
            let usePaymaster = false;
            let paymasterData = '0x';

            if (paymasterUtils && paymasterQuote) {
              try {
                paymasterData = await paymasterUtils.getPaymasterStubData();
                usePaymaster = true;

                // AJOUT DE L'APPEL APPROVE POUR LE PAYMASTER
                const approveCall = {
                  to: CVTC_TOKEN_ADDRESS,
                  data: encodeFunctionData({
                    abi: CVTC_TOKEN_ABI,
                    functionName: 'approve',
                    args: [PAYMASTER_ADDRESS, paymasterQuote.quote],
                  }),
                  value: 0n,
                };
                allCalls.unshift(approveCall); // Ajouter l'approve au début du batch

              } catch (paymasterError) {
                console.warn('⚠️ Paymaster non disponible, utilisation sans paymaster:', paymasterError.message);
              }
            }

            if (usePaymaster) {
              const gasPrice = await bundler.getUserOperationGasPrice();
              const userOp = {
                calls: allCalls,
                maxFeePerGas: gasPrice.fast.maxFeePerGas,
                maxPriorityFeePerGas: gasPrice.fast.maxPriorityFeePerGas,
                paymaster: config.paymasterAddress,
                paymasterData,
                paymasterVerificationGasLimit: 150000n,
                paymasterPostOpGasLimit: 35000n,
              };
              const signedUserOp = await account.signUserOperation(userOp);
              const userOpReceipt = await bundler.sendUserOperation(signedUserOp);
              setTxHash(userOpReceipt);
            } else {
              const userOpReceipt = await smartAccount.sendUserOperation({ calls: transferCalls }); // N'inclut pas l'approve si pas de paymaster
              setTxHash(userOpReceipt);
            }
            setTimeout(() => checkBalance(), 5000);

          } catch (error) {
            console.error('❌ Erreur lors des transactions ERC-4337:', error);
            setError(`Erreur lors des transactions ERC-4337: ${error.message}`);
          }
        }
      }
      // La logique pour les transferts planifiés a été retirée car non fonctionnelle.
    } catch (err) {
      console.error("❌ Erreur transfert:", err);
      setError(`Erreur lors du transfert: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  }, [smartAccount, recipients, amount, balance, frequency, validatePrivyAuth, checkBalance, smartAccountAddress, wallets, isMultiOwner, bundler, config, paymasterUtils, account]);

  return {
    currentAddress,
    setCurrentAddress,
    recipients,
    amount,
    setAmount,
    frequency,
    setFrequency,
    isSending,
    txHash,
    error,
    balance,
    isLoadingBalance,
    handleAddRecipient,
    handleRemoveRecipient,
    handleReset,
    checkBalance,
    handleSend
  };
};