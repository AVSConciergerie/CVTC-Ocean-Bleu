import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, X, Plus } from 'lucide-react';
import { usePimlico } from '../context/PimlicoContext';
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
  }
];

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

    // Vérifier si le solde est suffisant
    if (balance !== null && parseFloat(amount) > parseFloat(balance)) {
      setError(`Solde insuffisant. Vous avez ${balance} CVTC, mais essayez d'envoyer ${amount} CVTC.`);
      return;
    }

    setIsSending(true);
    console.log('Début de l\'envoi de tokens CVTC...');

    try {
      // Le token CVTC utilise 2 décimales
      const amountInWei = parseUnits(amount, 2);
      console.log('💰 Montant converti:', amountInWei.toString());

      const transactionData = encodeFunctionData({
        abi: CVTC_TOKEN_ABI,
        functionName: 'transfer',
        args: [recipients[0], amountInWei] // Envoi au premier destinataire
      });
      console.log('📝 Transaction data:', transactionData);

      const transactionRequest = {
        to: CVTC_TOKEN_ADDRESS, // Adresse du contrat du token
        value: 0n, // 0 car on n'envoie pas de BNB natif
        data: transactionData, // L'appel de fonction encodé
      };
      console.log('🚀 Envoi de la transaction:', transactionRequest);

      const hash = await smartAccount.sendTransaction(transactionRequest);

      console.log('🎉 Transaction envoyée avec succès ! Hash :', hash);
      setTxHash(hash);
    } catch (err) {
      console.error("❌ Erreur détaillée:", {
        message: err.message,
        stack: err.stack,
        cause: err.cause,
        details: err.details
      });
      setError(`Erreur: ${err.message}${err.details ? ' - ' + JSON.stringify(err.details) : ''}`);
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
          <h1 className="text-3xl font-bold text-heading">Transfert P2P CVTC</h1>
          <p className="text-text-secondary mt-2">Envoyez, recevez ou programmez vos transferts de tokens CVTC.</p>
        </div>

        <div className="text-center mt-8 p-3 rounded-lg bg-card-bg border border-card-border">
          {smartAccount ? (
            <div className="space-y-2">
              <p className="text-sm text-green-400">
                ✅ Smart Account prêt : <code className="font-mono text-xs">{smartAccountAddress}</code>
              </p>
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
          <div className="mt-4 p-3 rounded-lg bg-green-900/50 border border-green-400 text-center">
            <p className="text-green-400 text-sm">🎉 Transfert réussi !</p>
            <a href={`https://testnet.bscscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-xs font-mono break-all">
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
            <div className="p-4 bg-card-bg/50 border border-card-border rounded-lg text-sm space-y-2">
              <h3 className="font-semibold text-heading">Résumé</h3>
              <p>Vous êtes sur le point d'envoyer un total de <span className="font-bold text-accent">{summary.totalAmount} CVTC</span>.</p>
              <p>À <span className="font-bold text-accent">{summary.numAddresses}</span> adresse(s) destinataire(s).</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-card-border">
            <button onClick={handleReset} className="button button-secondary">Annuler</button>
            {frequency === 'unique' ? (
              <button 
                onClick={handleSend} 
                className="button disabled:opacity-50"
                disabled={!smartAccount || isSending}
              >
                {isSending ? 'Envoi en cours...' : 'Envoyer maintenant'}
              </button>
            ) : (
              <button 
                onClick={handleSchedule} 
                className="button disabled:opacity-50"
                disabled={!smartAccount || isSending}
              >
                {isSending ? 'Envoi en cours...' : 'Programmer le transfert'}
              </button>
            )}
          </div>
        </div>

        <div className="text-center mt-12">
            <p className="text-xs text-text-secondary">⚠️ Vérifiez bien l’adresse du destinataire avant d’envoyer.</p>
        </div>
      </div>
    </div>
  );
}