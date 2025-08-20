import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, X, Plus, Trash2 } from 'lucide-react';

export default function P2PTransferPage() {
  // State for the form
  const [currentAddress, setCurrentAddress] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('unique');

  // State for the dynamic summary
  const [summary, setSummary] = useState({});

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
  };

  const handleSend = () => {
    console.log('Sending now:', { recipients, amount, frequency });
    // Logic for sending will be added here
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


  return (
    <div className="p-8 text-text-primary">
      <Link to="/fonctionnalites" className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary mb-8">
        <ArrowLeft size={18} />
        Retour aux Fonctionnalités
      </Link>

      <div className="max-w-2xl mx-auto">
        {/* --- Titre & Description --- */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-heading">Transfert P2P CVTC</h1>
          <p className="text-text-secondary mt-2">Envoyez, recevez ou programmez vos transferts de tokens CVTC.</p>
        </div>

        <div className="mt-10 space-y-8">
          {/* --- Champ Destinataire --- */}
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

          {/* --- Champ Montant --- */}
          <div>
            <label className="block text-sm font-medium mb-2">Montant en CVTC</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full p-2 rounded-md bg-card-bg border border-card-border focus:ring-2 focus:ring-accent focus:outline-none"
            />
            <p className="text-xs text-text-secondary mt-1">Si &gt;1000 CVTC, le transfert sera fractionné automatiquement.</p>
          </div>

          {/* --- Fréquence --- */}
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

          {/* --- Résumé Dynamique --- */}
          {summary.numAddresses > 0 && summary.totalAmount > 0 && (
            <div className="p-4 bg-card-bg/50 border border-card-border rounded-lg text-sm space-y-2">
              <h3 className="font-semibold text-heading">Résumé</h3>
              <p>Vous êtes sur le point d'envoyer un total de <span className="font-bold text-accent">{summary.totalAmount} CVTC</span>.</p>
              <p>À <span className="font-bold text-accent">{summary.numAddresses}</span> adresse(s) destinataire(s).</p>
              <p>Fréquence : <span className="font-bold text-accent">{frequency}</span>.</p>
              {summary.splits.length > 0 && (
                <p>Le transfert sera découpé en {summary.splits.length} lots : <span className="font-mono text-xs">[{summary.splits.join(', ')}]</span></p>
              )}
            </div>
          )}

          {/* --- Boutons d'action --- */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-card-border">
            <button onClick={handleReset} className="button button-secondary">Annuler</button>
            {frequency === 'unique' ? (
              <button onClick={handleSend} className="button">Envoyer maintenant</button>
            ) : (
              <button onClick={handleSchedule} className="button">Programmer le transfert</button>
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
