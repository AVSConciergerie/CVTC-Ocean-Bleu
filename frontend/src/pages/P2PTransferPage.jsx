import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, X, Plus } from 'lucide-react';
import { usePimlico } from '../context/PimlicoContext';
import { ethers } from 'ethers';
import { encodeFunctionData, parseUnits, formatUnits } from 'viem';
import { createPublicClient, http } from 'viem';
import { bscTestnet } from 'viem/chains';

// --- Constantes du Contrat CVTC ---
const CVTC_TOKEN_ADDRESS = '0x532FC49071656C16311F2f89E6e41C53243355D3';
const CVTC_TOKEN_ABI = [
  {
    "constant": false,
    "inputs": [
      { "name": "_to", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "_spender", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      { "name": "_owner", "type": "address" },
      { "name": "_spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function"
  }
];

// --- Constantes des Contrats Déployés ---
const CVTC_SWAP_ADDRESS = process.env.VITE_CVTC_SWAP_ADDRESS || '0x0000000000000000000000000000000000000000';
const CVTC_PREMIUM_ADDRESS = process.env.VITE_CVTC_PREMIUM_ADDRESS || '0x0000000000000000000000000000000000000000';
const CVTC_PREMIUM_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "receiver", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "initiateStaggeredTransfer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isPremiumUser",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Configuration du provider BSC Testnet avec Ethers v6
const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/');

// Client public viem pour la compatibilité avec permissionless
const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(),
});

export default function P2PTransferPage() {
  const { smartAccount, smartAccountAddress } = usePimlico();

  // State for the form
  const [currentAddress, setCurrentAddress] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('unique');
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  // State for the dynamic summary
  const [summary, setSummary] = useState({});
  const [balance, setBalance] = useState(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // --- Form Handlers ---
  const handleAddRecipient = () => {
    if (currentAddress && !recipients.includes(currentAddress)) {
      setRecipients([...recipients, currentAddress]);
      setCurrentAddress('');
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

  const checkBalance = async () => {
    if (!smartAccountAddress) return;

    setIsLoadingBalance(true);
    try {
      const balanceResult = await publicClient.readContract({
        address: CVTC_TOKEN_ADDRESS,
        abi: CVTC_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [smartAccountAddress],
      });

      const formattedBalance = formatUnits(balanceResult, 2);
      setBalance(formattedBalance);
    } catch (err) {
      console.error('Erreur lors de la vérification du solde:', err);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleSend = async () => {
    setError(null);
    setTxHash(null);

    if (!smartAccount || recipients.length === 0 || !amount || parseFloat(amount) <= 0) {
      const errorMsg = "Veuillez vérifier les informations : Smart Account non prêt, destinataire manquant ou montant invalide.";
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    // Vérifier si les contrats sont déployés
    const hasSwapContract = CVTC_SWAP_ADDRESS !== '0x0000000000000000000000000000000000000000';
    const hasPremiumContract = CVTC_PREMIUM_ADDRESS !== '0x0000000000000000000000000000000000000000';

    console.log("🔍 Debug contrats:");
    console.log("   CVTC_SWAP_ADDRESS:", CVTC_SWAP_ADDRESS);
    console.log("   CVTC_PREMIUM_ADDRESS:", CVTC_PREMIUM_ADDRESS);
    console.log("   hasPremiumContract:", hasPremiumContract);

    // Vérification simplifiée - considérer le contrat comme déployé si l'adresse est valide
    const isValidAddress = CVTC_PREMIUM_ADDRESS && CVTC_PREMIUM_ADDRESS.length === 42 && CVTC_PREMIUM_ADDRESS.startsWith('0x');

    if (!isValidAddress) {
      console.log("❌ Erreur: Adresse du contrat Premium invalide");
      setError("🔄 Le système de transferts est en cours d'initialisation. Veuillez réessayer dans quelques instants.");
      return;
    }

    // Vérifier si le contrat existe réellement sur le réseau
    try {
      console.log("🔍 Vérification de l'existence du contrat Premium...");
      const code = await publicClient.getCode({ address: CVTC_PREMIUM_ADDRESS });
      console.log("📋 Code du contrat:", code);

      if (code === '0x') {
        console.log("❌ Aucun code trouvé à cette adresse - contrat non déployé");
        setError("❌ Le système de transferts est en cours d'initialisation. Veuillez réessayer dans quelques instants.");
        return;
      }

      console.log("✅ Contrat Premium détecté et valide sur le réseau");
    } catch (contractCheckError) {
      console.log("❌ Erreur lors de la vérification du contrat:", contractCheckError);
      setError("❌ Impossible de vérifier le contrat Premium. Veuillez réessayer.");
      return;
    }

    // Vérifier si le solde est suffisant
    if (balance !== null && parseFloat(amount) > parseFloat(balance)) {
      setError(`Solde insuffisant. Vous avez ${balance} CVTC, mais essayez d'envoyer ${amount} CVTC.`);
      return;
    }

    setIsSending(true);
    console.log('🚀 Début du transfert échelonné CVTC...');

    try {
      // Le token CVTC utilise 2 décimales
      const amountInWei = parseUnits(amount, 2);
      console.log('💰 Montant à transférer:', amountInWei.toString(), 'CVTC');

      // Étape 1: Approuver le contrat premium pour dépenser les tokens
      console.log('🔓 Approbation des tokens pour le transfert...');
      const approveData = encodeFunctionData({
        abi: CVTC_TOKEN_ABI,
        functionName: 'approve',
        args: [CVTC_PREMIUM_ADDRESS, amountInWei]
      });

      const approveTx = {
        to: CVTC_TOKEN_ADDRESS,
        value: 0n,
        data: approveData,
      };

      console.log('📝 Transaction d\'approbation:', approveTx);
      const approveHash = await smartAccount.sendTransaction(approveTx);
      console.log('✅ Approbation réussie - Hash:', approveHash);

      // Étape 2: Initier le transfert échelonné via le contrat premium
      console.log('Initiation du transfert...');
      const transferData = encodeFunctionData({
        abi: CVTC_PREMIUM_ABI,
        functionName: 'initiateStaggeredTransfer',
        args: [recipients[0], amountInWei] // Destinataire et montant
      });

      const transferTx = {
        to: CVTC_PREMIUM_ADDRESS, // Adresse du contrat premium
        value: 0n,
        data: transferData,
      };

      console.log('📝 Transaction de transfert échelonné:', transferTx);
      const transferHash = await smartAccount.sendTransaction(transferTx);

      console.log('🎉 Transfert initié avec succès ! Hash :', transferHash);
      console.log('⏱️  Distribution progressive des fonds');
      console.log('📅 Première tranche disponible dans 30 jours (ou 15 secondes en mode accéléré)');

      setTxHash(transferHash);

    } catch (err) {
      console.error("❌ Erreur détaillée:", {
        message: err.message,
        stack: err.stack,
        cause: err.cause,
        details: err.details
      });
      setError(`Erreur technique: ${err.message}. Veuillez vérifier votre connexion et réessayer.`);
    } finally {
      setIsSending(false);
    }
  };

  const handleSchedule = () => {
    console.log('Scheduling transfer:', { recipients, amount, frequency });
    // Logic for scheduling will be added here
  };

  // --- Dynamic Summary Logic ---
  useEffect(() => {
    const totalAmount = parseFloat(amount) || 0;
    const numAddresses = recipients.length;
    let splits = [];

    if (totalAmount > 1000) {
      let remaining = totalAmount;
      while (remaining > 0) {
        const part = Math.min(remaining, 1024);
        splits.push(part);
        remaining -= part;
      }
    }

    setSummary({
      totalAmount,
      numAddresses,
      frequency,
      splits,
    });
  }, [recipients, amount, frequency]);

  // Vérifier le solde quand le smart account est prêt
  useEffect(() => {
    if (smartAccountAddress) {
      checkBalance();
    }
  }, [smartAccountAddress]);


  return (
    <div className="p-8 text-text-primary">
      <Link to="/fonctionnalites" className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary mb-8">
        <ArrowLeft size={18} />
        Retour aux Fonctionnalités
      </Link>

      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-heading">Transferts Échelonnés CVTC</h1>
          <p className="text-text-secondary mt-2">
            Payez maintenant, recevez progressivement. Découvrez l'innovation des transferts échelonnés !
          </p>
          <div className="mt-4 p-3 bg-gradient-to-r from-accent/20 to-blue-500/20 rounded-lg border border-accent/30">
            <p className="text-sm text-accent font-medium">
              💡 Révolutionnez vos transferts : payez maintenant, recevez progressivement avec notre système échelonné !
            </p>
          </div>
        </div>

        <div className="text-center mt-8 p-4 rounded-lg bg-card-bg border border-card-border">
          {smartAccount ? (
            <div className="space-y-3">
              <p className="text-sm text-green-400">
                ✅ Smart Account prêt : <code className="font-mono text-xs">{smartAccountAddress}</code>
              </p>
              <div className="flex items-center justify-center gap-4 text-xs">
                {CVTC_SWAP_ADDRESS !== '0x0000000000000000000000000000000000000000' && (
                  <p className="text-green-400">
                    ✅ CVTC Swap déployé
                  </p>
                )}
                {CVTC_PREMIUM_ADDRESS && CVTC_PREMIUM_ADDRESS.length === 42 && CVTC_PREMIUM_ADDRESS.startsWith('0x') ? (
                   <p className="text-blue-400">
                       : 
                   </p>
                 ) : (
                   <p className="text-yellow-400">
                     🔄 Système en cours d'initialisation
                   </p>
                 )}
              </div>
              <div className="text-sm">
                {isLoadingBalance ? (
                  <p className="text-yellow-400">⏳ Vérification du solde CVTC...</p>
                ) : balance !== null ? (
                  <p className="text-blue-400">
                    💰 Solde CVTC : <span className="font-bold">{parseFloat(balance).toFixed(6)} CVTC</span>
                  </p>
                ) : (
                  <button 
                    onClick={checkBalance}
                    className="text-accent hover:underline"
                  >
                    🔍 Vérifier le solde CVTC
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-yellow-400">⏳ Initialisation du Smart Account en cours...</p>
          )}
        </div>

        {/* --- Zone de résultat de la transaction --- */}
        {txHash && (
          <div className="mt-4 p-4 rounded-lg bg-green-900/50 border border-green-400 text-center space-y-2">
            <p className="text-green-400 text-lg font-semibold">🎉 Transfert initié avec succès !</p>
            <div className="text-sm text-green-300 space-y-1">
              <p>✅ Paiement intégral effectué avec succès</p>
              <p>⏱️  Libération progressive des fonds</p>
              <p>📅 Calendrier: 1, 2, 4, 8, 16, 32... CVTC par tranche</p>
              <p>🕐 Première libération: 30 jours (ou 15s en mode test)</p>
            </div>
            <a href={`https://testnet.bscscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-xs font-mono break-all block mt-3">
              Voir sur BSCScan : {txHash}
            </a>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-900/50 border border-red-400 text-center">
            <p className="text-red-400 text-sm">❌ Erreur de transfert</p>
            <p className="text-text-secondary text-xs break-words">{error}</p>
          </div>
        )}

        <div className="mt-10 space-y-8">
          <div>
            <label className="block text-sm font-medium mb-2">Destinataire(s)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={currentAddress}
                onChange={(e) => setCurrentAddress(e.target.value)}
                placeholder="0x..."
                className="flex-grow p-2 rounded-md bg-card-bg border border-card-border focus:ring-2 focus:ring-accent focus:outline-none"
              />
              <button onClick={handleAddRecipient} className="p-2 bg-accent/20 text-accent rounded-md hover:bg-accent/30">
                <Plus size={20} />
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {recipients.map(address => (
                <div key={address} className="flex items-center justify-between bg-card-bg/50 p-2 rounded-md text-sm">
                  <span className="font-mono">{address}</span>
                  <button onClick={() => handleRemoveRecipient(address)} className="text-red-500 hover:text-red-400">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Montant en CVTC</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full p-2 rounded-md bg-card-bg border border-card-border focus:ring-2 focus:ring-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Fréquence</label>
            <select 
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full p-2 rounded-md bg-card-bg border border-card-border focus:ring-2 focus:ring-accent focus:outline-none"
            >
              <option value="unique">Unique</option>
              <option value="hourly">Toutes les heures</option>
              <option value="daily">Tous les jours</option>
              <option value="weekly">Toutes les semaines</option>
              <option value="monthly">Tous les mois</option>
            </select>
          </div>

          {summary.numAddresses > 0 && summary.totalAmount > 0 && (
            <div className="p-4 bg-card-bg/50 border border-card-border rounded-lg text-sm space-y-3">
              <h3 className="font-semibold text-heading">📋 Aperçu de votre Transfert Échelonné</h3>

              <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
                <p className="text-blue-300 font-medium mb-2">💰 Montant total à envoyer :</p>
                <p className="text-xl font-bold text-accent">{summary.totalAmount} CVTC</p>
                <p className="text-xs text-blue-400 mt-1">Paiement intégral immédiat ✅</p>
              </div>

              <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3">
                <p className="text-green-300 font-medium mb-2">Destinataire(s) :</p>
                <p className="font-bold text-green-400">{summary.numAddresses} adresse(s)</p>
                <p className="text-xs text-green-400 mt-1">Réception progressive ⏱️</p>
              </div>

              <div className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-3">
                <p className="text-purple-300 font-medium mb-2">📅 Calendrier de réception :</p>
                {summary.totalAmount > 1000 ? (
                  <div className="space-y-1">
                    {summary.splits.map((split, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span>Mois {index + 1}:</span>
                        <span className="font-mono text-purple-400">{split.toFixed(2)} CVTC</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-purple-400">
                    Transfert standard (montant ≤ 1000 CVTC)
                  </p>
                )}
              </div>

              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                <p className="text-yellow-300 font-medium mb-1">⚡ Mode de distribution :</p>
                <p className="text-xs text-yellow-400">
                  {summary.totalAmount > 1000 ?
                    "Échelonné automatique (séquence progressive)" :
                    "Transfert immédiat"
                  }
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-card-border">
            <button onClick={handleReset} className="button button-secondary">Annuler</button>
            <button
              onClick={handleSend}
              className="button disabled:opacity-50"
              disabled={!smartAccount || isSending}
            >
              {isSending ? 'Initiation en cours...' :
               CVTC_PREMIUM_ADDRESS === '0x0000000000000000000000000000000000000000' ?
               'Préparation en cours...' : '� Initier Transfert Échelonné'}
            </button>
          </div>
        </div>

        <div className="text-center mt-12">
            <p className="text-xs text-text-secondary">💡 Conseil : Vérifiez toujours l'adresse du bénéficiaire pour une sécurité optimale.</p>
        </div>
      </div>
    </div>
  );
}