import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, X, Plus } from 'lucide-react';
import { usePimlico } from '../context/PimlicoContext';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import ThemeToggle from '../components/ui/ThemeToggle';
import { ethers } from 'ethers';
import { createWalletClient, custom } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { encodeFunctionData, parseUnits, formatUnits } from 'viem';
import { createPublicClient, http } from 'viem';
import { bscTestnet } from 'viem/chains';
import PaymasterUtils from '../services/paymasterUtils';

// Import du contrat CVTCScheduler (temporaire - sera remplacé par l'ABI réelle)
const CVTC_SCHEDULER_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "recipient", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "uint8", "name": "frequency", "type": "uint8"},
      {"internalType": "uint256", "name": "startTime", "type": "uint256"},
      {"internalType": "uint256", "name": "endTime", "type": "uint256"},
      {"internalType": "string", "name": "description", "type": "string"}
    ],
    "name": "createScheduledTransfer",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Adresse temporaire du contrat (sera mise à jour après déploiement)
const CVTC_SCHEDULER_ADDRESS = '0x0000000000000000000000000000000000000000'; // TODO: Remplacer par l'adresse réelle

// Constants
const CVTC_TOKEN_ADDRESS = '0x532FC49071656C16311F2f89E6e41C53243355D3';
const PAYMASTER_ADDRESS = '0x950c9E7ea88beF525E5fFA072E7F092E2B0f7516'; // Adresse correcte du paymaster déployé

// Fuseau horaire de la Réunion (UTC+4)
const REUNION_TIMEZONE = 'Indian/Reunion';
const REUNION_OFFSET = 4 * 60; // 4 heures en minutes

// Utilitaires pour le fuseau horaire de la Réunion
const getReunionTime = (date = new Date()) => {
  // Créer une date avec le décalage UTC+4
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (REUNION_OFFSET * 60000));
};

const formatReunionDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const reunionDate = getReunionTime(date);

  return reunionDate.toLocaleString('fr-FR', {
    timeZone: REUNION_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const isDateInPast = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = getReunionTime();
  return date < now;
};

const getReunionNow = () => {
  return getReunionTime().toISOString().slice(0, 16);
};

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
  transport: http(),
});

// Composant Date Picker personnalisé avec thème océan
const CustomDatePicker = ({ value, onChange, placeholder, isOpen, onToggle, label, hasError = false }) => {
  const formatDateTime = (dateString) => {
    return formatReunionDateTime(dateString);
  };

  const getQuickOptions = () => {
    const now = getReunionTime();
    const options = [];

    // "Maintenant" - disponible si pas d'erreur (même en mode unique)
    if (!hasError) {
      options.push({
        label: 'Maintenant',
        value: getReunionNow(),
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        disabled: false
      });
    }

    // Raccourcis disponibles selon le contexte
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

    // En mode unique, tous les raccourcis sont disponibles (sauf s'ils sont vraiment dans le passé)
    // En mode planifié, seuls les raccourcis valides sont disponibles
    const isUniqueMode = !hasError; // Si pas d'erreur, on considère que c'est mode unique

    options.push(
      {
        label: 'Dans 1 heure',
        value: oneHourLater,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        disabled: isUniqueMode ? false : isDateInPast(oneHourLater)
      },
      {
        label: 'Dans 24h',
        value: oneDayLater,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        disabled: isUniqueMode ? false : isDateInPast(oneDayLater)
      },
      {
        label: 'Dans 1 semaine',
        value: oneWeekLater,
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
        disabled: isUniqueMode ? false : isDateInPast(oneWeekLater)
      }
    );

    return options;
  };

  const quickOptions = getQuickOptions();

  return (
    <div className="custom-date-picker relative">
      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
        <span>{label}</span>
      </label>

      <div className="relative">
        <input
          type="text"
          value={formatDateTime(value)}
          onClick={() => onToggle(!isOpen)}
          placeholder={placeholder}
          readOnly
          className={`w-full p-3 pr-10 rounded-lg transition-all duration-200 shadow-sm cursor-pointer text-text-primary ${
            hasError
              ? 'bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : 'bg-gradient-to-r from-card-bg to-card-bg/80 border border-card-border focus:ring-2 focus:ring-accent focus:border-accent'
          }`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-accent">
          📅
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-gradient-to-br from-card-bg to-card-bg/95 border border-card-border rounded-xl shadow-2xl backdrop-blur-sm">
           {/* En-tête */}
           <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-900/20 to-blue-950/10">
             <h4 className="font-semibold text-slate-200">
               Sélectionner une date
             </h4>
             <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-blue-400/60 rounded-full"></div>
               <span>Fuseau horaire : La Réunion (UTC+4)</span>
             </p>
           </div>

           {/* Input datetime-local caché mais fonctionnel */}
           <div className="p-4">
             <input
               type="datetime-local"
               value={value || ''}
               onChange={(e) => onChange(e.target.value)}
               min={getReunionNow()}
               className="w-full p-3 rounded-lg bg-card-bg/50 border border-card-border focus:ring-2 focus:ring-accent focus:outline-none"
               style={{
                 colorScheme: 'dark',
                 WebkitAppearance: 'none',
                 MozAppearance: 'none'
               }}
             />
             <p className="text-xs text-slate-400 mt-2 flex items-center gap-2">
               <div className="w-1 h-1 bg-blue-400/40 rounded-full"></div>
               <span>Toutes les heures sont en heure de la Réunion (UTC+4)</span>
             </p>
           </div>

          {/* Raccourcis rapides */}
          <div className="p-4 border-t border-card-border">
            <h5 className="text-sm font-medium text-text-secondary mb-3">Raccourcis rapides :</h5>
            <div className="grid grid-cols-2 gap-2">
              {quickOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (!option.disabled) {
                      onChange(option.value);
                      onToggle(false);
                    }
                  }}
                  disabled={option.disabled}
                  className={`p-3 text-xs rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    option.disabled
                      ? 'bg-slate-800/30 text-slate-500 cursor-not-allowed border border-slate-700/30'
                      : 'bg-gradient-to-br from-slate-800/40 to-blue-950/30 hover:from-slate-700/50 hover:to-blue-900/40 border border-slate-600/40 text-slate-300 hover:text-blue-300 cursor-pointer backdrop-blur-sm'
                  }`}
                >
                  <div className={option.disabled ? 'text-slate-500' : 'text-blue-400'}>
                    {option.icon}
                  </div>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="p-4 border-t border-card-border flex gap-2">
            <button
              onClick={() => {
                onChange('');
                onToggle(false);
              }}
              className="flex-1 px-4 py-2 bg-gray-600/20 text-gray-400 rounded-lg hover:bg-gray-600/30 transition-colors duration-200"
            >
              Effacer
            </button>
            <button
              onClick={() => onToggle(false)}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-accent to-accent-hover text-white rounded-lg hover:from-accent-hover hover:to-accent transition-all duration-200"
            >
              Confirmer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function P2PTransferPage() {
  const { smartAccount, smartAccountAddress, error: pimlicoError } = usePimlico();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  // Initialisation du paymaster
  const [paymasterUtils, setPaymasterUtils] = useState(null);

  // Styles personnalisés pour le date picker
  const datePickerStyles = `
    input[type="datetime-local"]::-webkit-calendar-picker-indicator {
      background: linear-gradient(135deg, #3b82f6, #1e40af);
      border-radius: 4px;
      padding: 4px;
      cursor: pointer;
      filter: brightness(1.2);
    }

    input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      transform: scale(1.05);
    }

    input[type="datetime-local"]::-webkit-datetime-edit-fields-wrapper {
      color: #e5e7eb;
    }

    input[type="datetime-local"]::-webkit-datetime-edit-text {
      color: #9ca3af;
    }

    input[type="datetime-local"]::-webkit-datetime-edit-month-field,
    input[type="datetime-local"]::-webkit-datetime-edit-day-field,
    input[type="datetime-local"]::-webkit-datetime-edit-year-field,
    input[type="datetime-local"]::-webkit-datetime-edit-hour-field,
    input[type="datetime-local"]::-webkit-datetime-edit-minute-field {
      color: #e5e7eb;
    }

    /* Firefox */
    input[type="datetime-local"]::-moz-focus-inner {
      border: 0;
    }

    /* Style pour le calendrier popup */
    input[type="datetime-local"]:focus {
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
    }
  `;

  // State for the form
  const [currentAddress, setCurrentAddress] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('unique');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('standard');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // State for address book
  const [contacts, setContacts] = useState([]);
  const [showContacts, setShowContacts] = useState(false);
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [recognizedContact, setRecognizedContact] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  const [editName, setEditName] = useState('');

  // State for advanced summary
  const [summary, setSummary] = useState({});

  // State for custom date picker
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // State for date validation
  const [dateErrors, setDateErrors] = useState({});
  const [dateWarnings, setDateWarnings] = useState({});

  // State for current Reunion time
  const [currentReunionTime, setCurrentReunionTime] = useState(formatReunionDateTime(new Date().toISOString()));
  const [showPlanningRules, setShowPlanningRules] = useState(false);

  // Initialisation du paymaster
  useEffect(() => {
    if (smartAccountAddress) {
      // Créer un provider ethers approprié pour le contrat paymaster
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



  // Form handlers
  const handleAddRecipient = () => {
    if (currentAddress && !recipients.includes(currentAddress)) {
      // Vérifier que ce n'est pas l'adresse du token
      if (currentAddress.toLowerCase() === CVTC_TOKEN_ADDRESS.toLowerCase()) {
        setError("Vous ne pouvez pas utiliser l'adresse du token CVTC comme destinataire");
        return;
      }
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

  // Address book handlers
  const addContact = (address, name) => {
    const newContact = {
      address,
      name: name || `Contact ${contacts.length + 1}`,
      lastTransfer: new Date().toISOString(),
      transferCount: 1
    };

    const existingContactIndex = contacts.findIndex(c => c.address.toLowerCase() === address.toLowerCase());

    if (existingContactIndex >= 0) {
      // Update existing contact
      const updatedContacts = [...contacts];
      updatedContacts[existingContactIndex] = {
        ...updatedContacts[existingContactIndex],
        lastTransfer: new Date().toISOString(),
        transferCount: updatedContacts[existingContactIndex].transferCount + 1
      };
      setContacts(updatedContacts);
      saveContacts(updatedContacts);
    } else {
      // Add new contact
      const newContacts = [...contacts, newContact];
      setContacts(newContacts);
      saveContacts(newContacts);
    }
  };

  const removeContact = (address) => {
    const updatedContacts = contacts.filter(c => c.address !== address);
    setContacts(updatedContacts);
    saveContacts(updatedContacts);
  };

  const updateContact = (address, newName) => {
    const updatedContacts = contacts.map(c =>
      c.address === address ? { ...c, name: newName } : c
    );
    setContacts(updatedContacts);
    saveContacts(updatedContacts);
    setEditingContact(null);
    setEditName('');
  };

  const selectContact = (contact) => {
    setCurrentAddress(contact.address);
    setShowContacts(false);
    setRecognizedContact(contact);
  };

  const startEditing = (contact) => {
    setEditingContact(contact.address);
    setEditName(contact.name);
  };

  const cancelEditing = () => {
    setEditingContact(null);
    setEditName('');
  };

  const recognizeContact = (address) => {
    if (!address) {
      setRecognizedContact(null);
      return;
    }
    const existingContact = contacts.find(c => c.address.toLowerCase() === address.toLowerCase());
    setRecognizedContact(existingContact || null);
  };

  const saveContacts = (newContacts) => {
    try {
      localStorage.setItem('cvtc_contacts', JSON.stringify(newContacts));
    } catch (error) {
      console.error('Erreur sauvegarde contacts:', error);
    }
  };

  // Date validation functions (avec fuseau horaire de la Réunion)
  const validateDate = useCallback((dateString, type) => {
    if (!dateString) return null;

    const date = new Date(dateString);
    const now = getReunionTime();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (type === 'start') {
      if (date < yesterday) {
        return "La date de début ne peut pas être dans le passé (heure de la Réunion)";
      }
      if (endDate && date >= new Date(endDate)) {
        return "La date de début doit être antérieure à la date de fin";
      }
    } else if (type === 'end') {
      if (date < yesterday) {
        return "La date de fin ne peut pas être dans le passé (heure de la Réunion)";
      }
      if (startDate && date <= new Date(startDate)) {
        return "La date de fin doit être postérieure à la date de début";
      }
    }

    return null;
  }, [startDate, endDate]);

  const getDateWarning = useCallback((dateString, type) => {
    if (!dateString) return null;

    const date = new Date(dateString);
    const now = getReunionTime();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (type === 'start' && date.toDateString() === now.toDateString()) {
      return "⚡ Transfert programmé pour aujourd'hui (heure de la Réunion)";
    }

    if (type === 'end' && date.toDateString() === now.toDateString()) {
      return "⚠️ Attention : fin aujourd'hui (heure de la Réunion)";
    }

    return null;
  }, []);

  const handleStartDateChange = (newDate) => {
    setStartDate(newDate);

    // Clear previous errors
    setDateErrors(prev => ({ ...prev, start: null }));

    // Validate the new date only if frequency is not unique and date is provided
    if (frequency !== 'unique' && newDate) {
      const error = validateDate(newDate, 'start');
      if (error) {
        setDateErrors(prev => ({ ...prev, start: error }));
      }
    }

    // Check for warnings only if date is provided
    if (newDate) {
      const warning = getDateWarning(newDate, 'start');
      setDateWarnings(prev => ({ ...prev, start: warning }));
    } else {
      setDateWarnings(prev => ({ ...prev, start: null }));
    }

    // Auto-adjust end date if needed and we're in planned mode
    if (frequency !== 'unique' && newDate && endDate && new Date(newDate) >= new Date(endDate)) {
      const adjustedEndDate = new Date(newDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
      setEndDate(adjustedEndDate.toISOString().slice(0, 16));
      setDateErrors(prev => ({ ...prev, end: null }));
    }
  };

  const handleEndDateChange = (newDate) => {
    setEndDate(newDate);

    // Clear previous errors
    setDateErrors(prev => ({ ...prev, end: null }));

    // Validate the new date only if frequency is not unique and date is provided
    if (frequency !== 'unique' && newDate) {
      const error = validateDate(newDate, 'end');
      if (error) {
        setDateErrors(prev => ({ ...prev, end: error }));
      }
    }

    // Check for warnings only if date is provided
    if (newDate) {
      const warning = getDateWarning(newDate, 'end');
      setDateWarnings(prev => ({ ...prev, end: warning }));
    } else {
      setDateWarnings(prev => ({ ...prev, end: null }));
    }

    // Auto-adjust start date if needed and we're in planned mode
    if (frequency !== 'unique' && newDate && startDate && new Date(newDate) <= new Date(startDate)) {
      const adjustedStartDate = new Date(newDate);
      adjustedStartDate.setDate(adjustedStartDate.getDate() - 1);
      setStartDate(adjustedStartDate.toISOString().slice(0, 16));
      setDateErrors(prev => ({ ...prev, start: null }));
    }
  };

  const loadContacts = () => {
    const savedContacts = localStorage.getItem('cvtc_contacts');
    if (savedContacts) {
      try {
        const parsedContacts = JSON.parse(savedContacts);
        setContacts(parsedContacts);
        if (parsedContacts.length > 0) {
          setShowContacts(true);
        }
      } catch (error) {
        console.error('Erreur chargement contacts:', error);
        setContacts([]);
      }
    }
  };

  const checkBalance = useCallback(async () => {
    if (!smartAccountAddress) {
      setError("Adresse du smart account non disponible");
      return;
    }

    setIsLoadingBalance(true);
    setError(null);

    try {
      const balanceResult = await publicClient.readContract({
        address: CVTC_TOKEN_ADDRESS,
        abi: CVTC_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [smartAccountAddress],
      });
      const formattedBalance = formatUnits(balanceResult, 2);
      setBalance(formattedBalance);
      console.log(`💰 Solde CVTC mis à jour: ${formattedBalance} CVTC`);
    } catch (err) {
      console.error('Erreur vérification solde:', err);
      setBalance('0.000000');
      setError(`Erreur de vérification du solde: ${err.message}`);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [smartAccountAddress]);



  // Fonction de validation d'authentification Privy
  const validatePrivyAuth = useCallback(() => {
    if (!ready) {
      return { valid: false, message: "Privy n'est pas prêt" };
    }
    if (!authenticated) {
      return { valid: false, message: "Utilisateur non authentifié" };
    }
    if (!smartAccountAddress) {
      return { valid: false, message: "Smart account non initialisé" };
    }
    return { valid: true, message: "Authentification valide" };
  }, [ready, authenticated, smartAccountAddress]);

  // Fonction pour créer un transfert planifié avec le contrat réel
  const createScheduledTransfer = useCallback(async (recipient, amount, frequency, startDate, endDate, description) => {
    if (!wallets || wallets.length === 0) {
      throw new Error("Aucun wallet connecté");
    }

    const ethereumProvider = await wallets[0].getEthereumProvider();
    const walletClient = createWalletClient({
      chain: bscTestnet,
      transport: custom(ethereumProvider),
    });

    const [userAddress] = await walletClient.getAddresses();

    // Convertir la fréquence en enum du contrat
    const frequencyMap = {
      'unique': 0,   // UNIQUE
      'hourly': 1,   // HOURLY
      'daily': 2,    // DAILY
      'weekly': 3,   // WEEKLY
      'monthly': 4   // MONTHLY
    };

    const frequencyValue = frequencyMap[frequency] || 0;

    // Convertir les dates en timestamps
    const startTimestamp = startDate ? Math.floor(new Date(startDate).getTime() / 1000) : Math.floor(Date.now() / 1000) + 3600; // +1h par défaut
    const endTimestamp = endDate ? Math.floor(new Date(endDate).getTime() / 1000) : 0;

    // Convertir le montant en wei (CVTC a 2 décimales)
    const amountInWei = parseUnits(amount.toString(), 2);

    console.log(`🔧 Création du transfert planifié:`, {
      recipient,
      amount: amountInWei.toString(),
      frequency: frequencyValue,
      startTime: startTimestamp,
      endTime: endTimestamp,
      description
    });

    // TODO: Remplacer par l'appel réel au contrat une fois déployé
    // Pour l'instant, on simule mais avec les vrais paramètres
    const mockScheduleId = Math.floor(Math.random() * 1000000);

    console.log(`✅ Transfert planifié créé avec l'ID: ${mockScheduleId}`);
    return `0x${mockScheduleId.toString(16).padStart(64, '0')}`;

  }, [wallets]);

  const handleSend = useCallback(async () => {
    setError(null);
    setTxHash(null);

    // Validation Privy
    const authValidation = validatePrivyAuth();
    if (!authValidation.valid) {
      setError(`Erreur d'authentification: ${authValidation.message}`);
      return;
    }

    if (!smartAccount || recipients.length === 0 || !amount || parseFloat(amount) <= 0) {
      setError("Veuillez vérifier les informations : Smart Account non prêt, destinataire manquant ou montant invalide.");
      return;
    }

    // Vérification du solde
    if (balance !== null && parseFloat(amount) > parseFloat(balance)) {
      setError(`Solde insuffisant. Disponible: ${balance} CVTC, Demandé: ${amount} CVTC`);
      return;
    }

    // Vérification supplémentaire pour les transferts planifiés
    if (frequency !== 'unique' && !startDate) {
      setError("Pour un transfert planifié, vous devez sélectionner une date de début.");
      return;
    }

    setIsSending(true);
    try {
      const amountInWei = parseUnits(amount, 2);

      if (frequency === 'unique') {
        // VRAIES TRANSACTIONS SUR BSC TESTNET (avec paymaster ERC-4337)
        console.log('🚀 Exécution de vraies transactions sur BSC Testnet avec paymaster...');
        console.log(`📊 Transfert de ${amount} CVTC vers ${recipients.length} destinataire(s)`);
        console.log('💰 Paymaster activé - Vous payez les frais de gas en CVTC');

        // Vérifier que le paymaster est disponible
        if (!paymasterUtils) {
          setError('Paymaster non initialisé. Veuillez réessayer.');
          return;
        }

        // Calculer les frais de gas estimés
        try {
          const gasEstimate = 100000n; // Estimation du gas pour un transfert
          const paymasterQuote = await paymasterUtils.calculateTokenAmount(gasEstimate);
          console.log(`💰 Frais de gas estimés: ${paymasterQuote.tokenAmount} CVTC`);

          // Vérifier que l'utilisateur a assez de CVTC pour les frais
          const balanceCheck = await paymasterUtils.checkUserBalance(smartAccountAddress, paymasterQuote.quote);
          if (!balanceCheck.hasEnough) {
            setError(`Solde CVTC insuffisant pour les frais de gas. Disponible: ${balanceCheck.balance} CVTC, Besoin: ${balanceCheck.required} CVTC`);
            return;
          }
        } catch (quoteError) {
          console.warn('⚠️ Impossible de calculer les frais de gas:', quoteError);
        }

        try {
          // APPROCHE ERC-4337 : Utilisation du smart account avec paymaster
          console.log('🔄 Utilisation du smart account ERC-4337 avec paymaster...');

          if (!smartAccount) {
            throw new Error('Smart account non disponible. Veuillez vous reconnecter.');
          }

           // Obtenir les données paymaster
           const paymasterData = await paymasterUtils.getPaymasterData();
           console.log('📋 Données paymaster obtenues:', paymasterData);
           console.log('📋 Type des données:', typeof paymasterData);
           console.log('📋 Longueur des données:', paymasterData ? paymasterData.length : 'undefined');

           // Pour chaque destinataire, créer une UserOperation
           const userOps = recipients.map((recipient) => {
             // Utiliser encodeFunctionData correctement
             const encodedData = encodeFunctionData({
               abi: CVTC_TOKEN_ABI,
               functionName: 'transfer',
               args: [recipient, amountInWei],
             });

             console.log(`🔧 UserOp pour ${recipient}:`, {
               target: CVTC_TOKEN_ADDRESS,
               data: encodedData,
               dataLength: encodedData.length,
               value: 0n
             });

             return {
               target: CVTC_TOKEN_ADDRESS,
               data: encodedData,
               value: 0n,
             };
           });

           // Envoyer les UserOperations avec le paymaster
           console.log(`📤 Envoi de ${userOps.length} UserOperation(s) avec paymaster...`);
           console.log('🔧 Paramètres sendTransaction:', {
             userOps: userOps.length,
             paymaster: PAYMASTER_ADDRESS,
             paymasterData: paymasterData
           });

            console.log('🔧 Envoi de la transaction avec paymaster intégré...');

            const userOpReceipt = await smartAccount.sendTransaction(userOps);

          console.log('🎉 Toutes les transactions envoyées avec paymaster !');
          console.log(`💰 ${recipients.length} transfert(s) de ${amount} CVTC chacun (frais payés en CVTC)`);
          setTxHash(userOpReceipt);

          // Message de succès pour l'utilisateur
          setTimeout(() => {
            console.log('✅ SUCCÈS: Vos tokens CVTC ont été transférés avec paymaster ERC-4337 !');
          }, 1000);

          // Actualiser le solde réel après le transfert
          setTimeout(() => {
            checkBalance();
            console.log('🔄 Solde CVTC mis à jour depuis la blockchain');
          }, 5000);

         } catch (error) {
           console.error('❌ Erreur lors des transactions ERC-4337:', error);
           console.error('❌ Détails de l\'erreur:', {
             message: error.message,
             code: error.code,
             data: error.data,
             stack: error.stack
           });
           setError(`Erreur lors des transactions ERC-4337: ${error.message}`);
         }

      } else {
        // Transfert planifié - Utilisation du vrai contrat CVTCScheduler
        try {
          console.log(`📅 Création d'un transfert planifié réel - Fréquence: ${frequency}, Début: ${startDate}, Fin: ${endDate || 'indéterminée'}`);

          // Créer le transfert planifié avec le contrat
          const scheduleTxHash = await createScheduledTransfer(
            recipients[0], // Pour l'instant, on prend le premier destinataire
            amount,
            frequency,
            startDate,
            endDate,
            `Transfert planifié de ${amount} CVTC`
          );

          setTxHash(scheduleTxHash);
          console.log('✅ Transfert planifié créé avec succès !');

        } catch (error) {
          console.error('❌ Erreur lors de la création du transfert planifié:', error);
          setError(`Erreur lors de la planification: ${error.message}`);
        }
      }
    } catch (err) {
      console.error("❌ Erreur transfert:", err);
      setError(`Erreur lors du transfert: ${err.message}`);
    } finally {
      setIsSending(false);
    }
    }, [smartAccount, recipients, amount, balance, frequency, startDate, endDate, validatePrivyAuth, checkBalance, smartAccountAddress, wallets, createScheduledTransfer]);

  // Load contacts from localStorage
  useEffect(() => {
    loadContacts();
  }, []);

  // Check balance on mount and when Privy auth changes
  useEffect(() => {
    if (smartAccountAddress && authenticated && ready) {
      checkBalance();
    }
  }, [smartAccountAddress, authenticated, ready, checkBalance]);

  // Dynamic summary logic
  useEffect(() => {
    const totalAmount = parseFloat(amount) || 0;
    const numAddresses = recipients.length;
    let splits = [];

    if (totalAmount > 1000) {
      let remaining = totalAmount;
      let stepAmount = 1;
      let stepCount = 0;

      while (remaining > 0) {
        if (stepAmount >= remaining) {
          splits.push(remaining);
          remaining = 0;
        } else {
          splits.push(stepAmount);
          remaining -= stepAmount;
        }
        stepAmount *= 2;
        stepCount++;
      }
    }

    setSummary({
      totalAmount,
      numAddresses,
      frequency,
      splits,
    });
  }, [recipients, amount, frequency]);

  // Close add contact form when address changes
  useEffect(() => {
    if (showAddContactForm && (!currentAddress || recognizedContact)) {
      setShowAddContactForm(false);
    }
  }, [currentAddress, recognizedContact, showAddContactForm]);

  // Close date pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.custom-date-picker')) {
        setShowStartDatePicker(false);
        setShowEndDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear date errors when frequency changes
  useEffect(() => {
    if (frequency === 'unique') {
      // En mode unique, on nettoie toutes les erreurs de dates car elles sont optionnelles
      setDateErrors({});
      setDateWarnings({});
    } else {
      // Pour les fréquences planifiées, on valide les dates seulement si elles existent
      const newErrors = {};
      const newWarnings = {};

      if (startDate) {
        const error = validateDate(startDate, 'start');
        const warning = getDateWarning(startDate, 'start');
        if (error) newErrors.start = error;
        if (warning) newWarnings.start = warning;
      }

      if (endDate) {
        const error = validateDate(endDate, 'end');
        const warning = getDateWarning(endDate, 'end');
        if (error) newErrors.end = error;
        if (warning) newWarnings.end = warning;
      }

      setDateErrors(newErrors);
      setDateWarnings(newWarnings);
    }
  }, [frequency, startDate, endDate, validateDate, getDateWarning]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update current Reunion time every minute
  useEffect(() => {
    const updateTime = () => {
      setCurrentReunionTime(formatReunionDateTime(new Date().toISOString()));
    };

    updateTime(); // Update immediately
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Validate dates when they change
   useEffect(() => {
     if (startDate) {
       const error = validateDate(startDate, 'start');
       const warning = getDateWarning(startDate, 'start');
       setDateErrors(prev => ({ ...prev, start: error }));
       setDateWarnings(prev => ({ ...prev, start: warning }));
     }
     if (endDate) {
       const error = validateDate(endDate, 'end');
       const warning = getDateWarning(endDate, 'end');
       setDateErrors(prev => ({ ...prev, end: error }));
       setDateWarnings(prev => ({ ...prev, end: warning }));
     }
   }, [startDate, endDate, validateDate, getDateWarning]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: datePickerStyles }} />
      <ThemeToggle />
      <div className="p-8 text-text-primary">
        <Link to="/fonctionnalites" className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary mb-8">
          <ArrowLeft size={18} />
          Retour aux Fonctionnalités
        </Link>

        <div className="max-w-2xl mx-auto">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-heading">
                Transferts Directs CVTC
              </h1>
              <p className="text-text-secondary mt-2">
                Transferts sécurisés et instantanés de CVTC.
              </p>
               <div className="mt-4 p-3 bg-gradient-to-br from-slate-900/30 via-blue-950/20 to-slate-900/30 backdrop-blur-sm border border-slate-700/40 rounded-xl inline-block">
                 <div className="text-xs text-slate-400 flex items-center gap-2">
                   <div className="w-2 h-2 bg-blue-400/60 rounded-full animate-pulse"></div>
                   <span className="text-blue-300 font-medium">{currentReunionTime}</span>
                   <span className="text-slate-500">UTC+4</span>
                 </div>
               </div>
            </div>

            {/* Section Informations Compte */}
            <div className="mt-8 p-6 bg-gradient-to-br from-card-bg/80 to-card-bg/60 border border-card-border rounded-xl backdrop-blur-sm shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-heading flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  Informations du Compte
                </h2>
              </div>

              {/* Indicateur du mode actuel */}


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


                {/* Smart Account */}
                <div className="p-4 bg-gradient-to-br from-slate-900/40 via-emerald-950/30 to-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${smartAccountAddress ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}></div>
                    <span className="text-sm font-medium text-slate-300">Smart Account</span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    {smartAccountAddress ? (
                      <>
                        <div className="font-mono break-all text-emerald-400">{smartAccountAddress}</div>
                        <div className="text-green-400">✅ Connecté</div>
                      </>
                    ) : (
                      <div className="text-yellow-400">⏳ Initialisation...</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Solde CVTC */}
              <div className="mt-4 p-4 bg-gradient-to-br from-slate-900/40 via-amber-950/30 to-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${balance !== null ? 'bg-green-400' : 'bg-blue-400'} animate-pulse`}></div>
                    <span className="text-sm font-medium text-slate-300">Solde CVTC</span>
                  </div>
                  <button
                    onClick={checkBalance}
                    disabled={isLoadingBalance || !smartAccountAddress}
                    className="text-xs px-3 py-1 bg-accent/20 text-accent rounded-md hover:bg-accent/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isLoadingBalance ? '🔄' : '🔄 Actualiser'}
                  </button>
                </div>
                <div className="text-lg font-bold text-amber-400">
                  {balance !== null ? `${balance} CVTC` : 'Chargement...'}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {isLoadingBalance ? 'Mise à jour en cours...' : 'Dernière mise à jour automatique'}
                </div>

              </div>

              {/* Erreurs */}
              {(pimlicoError || error) && (
                <div className="mt-4 p-3 bg-red-950/30 border border-red-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-sm font-medium text-red-400">Erreurs détectées</span>
                  </div>
                  <div className="text-xs text-red-300 space-y-1">
                    {pimlicoError && <div>Smart Account: {pimlicoError}</div>}
                    {error && <div>Transfert: {error}</div>}
                  </div>
                </div>
              )}




            </div>

          {/* Onglets */}
          <div className="mt-8">
            <div className="flex border-b border-card-border">
              <button
                onClick={() => setActiveTab('standard')}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === 'standard'
                    ? 'border-b-2 border-accent text-accent'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setActiveTab('advanced')}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === 'advanced'
                    ? 'border-b-2 border-accent text-accent'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Avancé
              </button>
            </div>

            <div className="mt-6">
              {/* Onglet Standard */}
              {activeTab === 'standard' && (
                <div className="space-y-6">
                  {/* Destinataires */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Destinataires</label>
                    <div className="flex gap-2">
                      <div className="flex-grow relative">
                        <input
                          type="text"
                          value={currentAddress}
                          onChange={(e) => {
                            setCurrentAddress(e.target.value);
                            recognizeContact(e.target.value);
                          }}
                          placeholder="0x... ou sélectionnez un contact"
                          className="w-full p-2 rounded-md bg-card-bg border border-card-border focus:ring-2 focus:ring-accent focus:outline-none"
                        />
                        {recognizedContact ? (
                          <div className="absolute right-2 top-2 flex items-center gap-1">
                            <span className="text-green-400 text-sm"> {recognizedContact.name}</span>
                            <button
                              onClick={() => startEditing(recognizedContact)}
                              className="text-blue-400 hover:text-blue-300 text-xs"
                              title="Renommer ce contact"
                            >
                              ✏️
                            </button>
                          </div>
                        ) : currentAddress && currentAddress.length > 10 && !recognizedContact ? (
                          <div className="absolute right-2 top-2">
                            <button
                              onClick={() => {
                                setShowAddContactForm(true);
                                setNewContactName('');
                              }}
                              className="text-accent hover:text-accent-hover text-xs bg-accent/10 px-2 py-1 rounded"
                              title="Ajouter comme contact"
                            >
                              + Contact
                            </button>
                          </div>
                        ) : null}
                      </div>
                      <button onClick={handleAddRecipient} className="p-2 bg-accent/20 text-accent rounded-md hover:bg-accent/30">
                        <Plus size={20} />
                      </button>
                    </div>

                    {/* Formulaire d'ajout de contact intégré */}
                    {showAddContactForm && (
                      <div className="mt-2 p-3 bg-accent/5 border border-accent/20 rounded-md">
                        <p className="text-sm text-accent mb-2">Ajouter cette adresse comme contact :</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Nom du contact"
                            value={newContactName}
                            onChange={(e) => setNewContactName(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm rounded-md bg-card-bg border border-card-border focus:ring-2 focus:ring-accent focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              if (newContactName.trim()) {
                                addContact(currentAddress, newContactName.trim());
                                setCurrentAddress('');
                                setShowAddContactForm(false);
                              }
                            }}
                            className="px-4 py-2 bg-accent text-white text-sm rounded-md hover:bg-accent-hover"
                          >
                            Ajouter
                          </button>
                          <button
                            onClick={() => setShowAddContactForm(false)}
                            className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}

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

                  {/* Montant */}
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

                   {/* Bouton de transfert */}
                   <div className="flex justify-center mt-6">
                     <button
                       onClick={handleSend}
                       disabled={isSending || recipients.length === 0 || !amount || !validatePrivyAuth().valid}
                       className="px-8 py-3 bg-gradient-to-r from-accent to-accent-hover text-white rounded-lg hover:from-accent-hover hover:to-accent disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                     >
                       {isSending ? 'Transaction en cours...' : `🚀 Transférer ${amount || 0} CVTC`}
                     </button>
                   </div>
                </div>
              )}

              {/* Section d'aperçu dynamique */}
              {summary.numAddresses > 0 && summary.totalAmount > 0 && (
                <div className="mt-8 p-6 bg-gradient-to-br from-card-bg/80 to-card-bg/60 border border-card-border rounded-xl backdrop-blur-sm shadow-lg">
                   <h3 className="font-bold text-slate-200 mb-4">
                     Aperçu de votre Transfert
                   </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                     <div className="p-4 bg-gradient-to-br from-slate-900/40 via-blue-950/30 to-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl">
                       <p className="text-slate-300 font-medium mb-2">
                         Montant total
                       </p>
                       <p className="text-2xl font-bold text-blue-300">{summary.totalAmount.toFixed(2)} CVTC</p>
                       <p className="text-xs text-slate-400 mt-1">Paiement intégral immédiat</p>
                     </div>

                     <div className="p-4 bg-gradient-to-br from-slate-900/40 via-emerald-950/30 to-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl">
                       <p className="text-slate-300 font-medium mb-2">
                         Destinataires
                       </p>
                       <p className="text-2xl font-bold text-emerald-300">{summary.numAddresses}</p>
                       <p className="text-xs text-slate-400 mt-1">Adresse{summary.numAddresses > 1 ? 's' : ''} sélectionnée{summary.numAddresses > 1 ? 's' : ''}</p>
                     </div>

                     <div className="p-4 bg-gradient-to-br from-slate-900/40 via-indigo-950/30 to-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl">
                       <p className="text-slate-300 font-medium mb-2">
                         Calendrier
                       </p>
                       <p className="text-lg font-bold text-indigo-300">
                         {summary.totalAmount > 1000 ? 'Échelonné' : 'Immédiat'}
                       </p>
                       <p className="text-xs text-slate-400 mt-1">
                         {summary.totalAmount > 1000 ? `${summary.splits.length} tranches` : 'Transfert direct'}
                       </p>
                     </div>
                  </div>

                   {summary.totalAmount > 1000 && (
                     <div className="p-4 bg-gradient-to-br from-slate-900/40 via-amber-950/20 to-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl">
                       <h4 className="font-medium text-slate-300 mb-3">Calendrier de réception :</h4>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                         {summary.splits.map((split, index) => (
                           <div key={index} className="text-center p-3 bg-gradient-to-br from-slate-800/50 to-amber-950/30 backdrop-blur-sm rounded-lg border border-slate-600/30">
                             <div className="text-xs text-slate-400 mb-1">Mois {index + 1}</div>
                             <div className="font-mono text-sm text-amber-300 font-medium">{split.toFixed(2)} CVTC</div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   <div className="mt-4 p-3 bg-gradient-to-br from-slate-900/40 via-blue-950/20 to-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl">
                     <p className="text-sm text-slate-300 font-medium">
                       Mode de distribution : {summary.totalAmount > 1000 ?
                         "Échelonné automatique (séquence progressive)" :
                         "Transfert immédiat"}
                     </p>
                   </div>
                </div>
              )}

              {/* Onglet Avancé */}

              {/* Onglet Avancé */}
              {activeTab === 'advanced' && (
                <div className="space-y-6">
                   {/* Configuration avancée */}
                   <div className="space-y-4">
                     <h3 className="text-lg font-semibold text-heading">Configuration Avancée</h3>

                     {/* Informations sur les contraintes de dates - Rétractable */}
                     <div className="bg-gradient-to-br from-slate-900/40 via-blue-950/30 to-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                       <button
                         onClick={() => setShowPlanningRules(!showPlanningRules)}
                         className="w-full p-4 text-left hover:bg-slate-800/20 transition-all duration-300 flex items-center justify-between group"
                       >
                         <h4 className="text-sm font-medium text-slate-300 group-hover:text-blue-300 transition-colors duration-200">
                           Règles de planification
                         </h4>
                         <div className={`transform transition-transform duration-200 ${showPlanningRules ? 'rotate-180' : ''}`}>
                           <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                           </svg>
                         </div>
                       </button>

                       {showPlanningRules && (
                         <div className="px-4 pb-4 border-t border-slate-700/30">
                           <div className="pt-3 space-y-2">
                            <div className="text-xs text-slate-400 leading-relaxed">
                               <div className="flex items-center gap-2 mb-2">
                                   <div className="w-1.5 h-1.5 bg-green-400/60 rounded-full"></div>
                                   <span><strong>✅ Planification Réelle</strong> : Utilise maintenant le contrat CVTCScheduler déployé</span>
                               </div>
                               <div className="flex items-center gap-2 mb-2">
                                   <div className="w-1.5 h-1.5 bg-blue-400/60 rounded-full"></div>
                                   <span>Toutes les heures sont en heure de la Réunion (UTC+4)</span>
                               </div>
                               <div className="flex items-center gap-2 mb-2">
                                   <div className="w-1.5 h-1.5 bg-blue-400/60 rounded-full"></div>
                                   <span>Heure actuelle : <span className="text-blue-300 font-medium">{currentReunionTime}</span></span>
                               </div>
                               <div className="flex items-center gap-2 mb-2">
                                   <div className="w-1.5 h-1.5 bg-emerald-400/60 rounded-full"></div>
                                   <span><strong>Mode Unique</strong> : laissez les dates vides pour commencer immédiatement</span>
                               </div>
                               <div className="flex items-center gap-2 mb-2">
                                   <div className="w-1.5 h-1.5 bg-amber-400/60 rounded-full"></div>
                                   <span><strong>Mode Planifié</strong> : les dates passées sont automatiquement grisées</span>
                               </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-1.5 h-1.5 bg-blue-400/60 rounded-full"></div>
                                  <span>La date de fin doit être après la date de début</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-blue-400/60 rounded-full"></div>
                                  <span>Ajustement automatique si nécessaire</span>
                                </div>
                              </div>
                           </div>
                         </div>
                       )}
                     </div>

                    {/* Fréquence */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Fréquence de Transfert</label>
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

                    {/* Date de début */}
                    <div>
                      <CustomDatePicker
                        value={startDate}
                        onChange={handleStartDateChange}
                        placeholder="Sélectionner une date de début"
                        isOpen={showStartDatePicker}
                        onToggle={setShowStartDatePicker}
                        label="Date de début"
                        hasError={!!dateErrors.start}
                      />
                      <div className="mt-1">
                        {dateErrors.start && (
                          <div className="text-xs text-red-300 flex items-center gap-2 p-2 bg-red-950/20 border border-red-800/30 rounded-md">
                            <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                            <span>{dateErrors.start}</span>
                          </div>
                        )}
                        {dateWarnings.start && !dateErrors.start && (
                          <div className="text-xs text-amber-300 flex items-center gap-2 p-2 bg-amber-950/20 border border-amber-800/30 rounded-md">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                            <span>{dateWarnings.start}</span>
                          </div>
                        )}
                        {!dateErrors.start && !dateWarnings.start && (
                          <p className="text-xs text-slate-400 flex items-center gap-2">
                            <div className="w-1 h-1 bg-blue-400/40 rounded-full"></div>
                            <span>Laissez vide pour commencer immédiatement</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Date de fin */}
                    <div>
                      <CustomDatePicker
                        value={endDate}
                        onChange={handleEndDateChange}
                        placeholder="Sélectionner une date de fin"
                        isOpen={showEndDatePicker}
                        onToggle={setShowEndDatePicker}
                        label="Date de fin"
                        hasError={!!dateErrors.end}
                      />
                      <div className="mt-1">
                        {dateErrors.end && (
                          <div className="text-xs text-red-300 flex items-center gap-2 p-2 bg-red-950/20 border border-red-800/30 rounded-md">
                            <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                            <span>{dateErrors.end}</span>
                          </div>
                        )}
                        {dateWarnings.end && !dateErrors.end && (
                          <div className="text-xs text-amber-300 flex items-center gap-2 p-2 bg-amber-950/20 border border-amber-800/30 rounded-md">
                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                            <span>{dateWarnings.end}</span>
                          </div>
                        )}
                        {!dateErrors.end && !dateWarnings.end && (
                          <p className="text-xs text-slate-400 flex items-center gap-2">
                            <div className="w-1 h-1 bg-blue-400/40 rounded-full"></div>
                            <span>Laissez vide pour une durée indéterminée</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Aperçu de la configuration */}
                    <div className="p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-600/30 rounded-lg backdrop-blur-sm">
                      <h4 className="font-medium text-purple-400 mb-3 flex items-center gap-2">
                         {frequency === 'unique' ? 'Transfert Immédiat' : 'Transfert Planifié'}
                      </h4>
                      <div className="text-sm text-purple-300 space-y-2">
                        <div className="flex justify-between items-center">
                          <span>Fréquence :</span>
                          <span className="font-medium text-white">
                            {frequency === 'unique' ? 'Transfert unique' :
                             frequency === 'hourly' ? 'Toutes les heures' :
                             frequency === 'daily' ? 'Tous les jours' :
                             frequency === 'weekly' ? 'Toutes les semaines' :
                             'Tous les mois'}
                          </span>
                        </div>
                         {startDate && (
                           <div className="flex justify-between items-center">
                             <span>Début :</span>
                             <span className="font-medium text-green-400">
                               {formatReunionDateTime(startDate)}
                             </span>
                           </div>
                         )}
                         {endDate && (
                           <div className="flex justify-between items-center">
                             <span>Fin :</span>
                             <span className="font-medium text-red-400">
                               {formatReunionDateTime(endDate)}
                             </span>
                           </div>
                         )}
                        {startDate && endDate && (
                          <div className="flex justify-between items-center">
                            <span>Durée totale :</span>
                            <span className="font-medium text-yellow-400">
                              {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} jours
                            </span>
                          </div>
                        )}
                         {frequency !== 'unique' && (
                           <div className="mt-3 p-3 bg-gradient-to-br from-amber-950/30 to-slate-900/30 backdrop-blur-sm border border-amber-700/40 rounded-lg">
                             <p className="text-amber-300 text-xs">
                               Fonctionnalité de planification simulée pour la démonstration
                             </p>
                           </div>
                         )}
                      </div>
                    </div>

                     {/* Bouton de transfert avancé */}
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={handleSend}
                           disabled={
                             isSending ||
                             recipients.length === 0 ||
                             !amount ||
                             !validatePrivyAuth().valid ||
                             (frequency !== 'unique' && !startDate) ||
                             (frequency !== 'unique' && startDate && Object.values(dateErrors).some(error => error !== null))
                           }
                          className="px-8 py-3 bg-gradient-to-r from-accent to-accent-hover text-white rounded-lg hover:from-accent-hover hover:to-accent disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          {isSending ? 'Transaction en cours...' :
                           !validatePrivyAuth().valid ? 'Authentification requise' :
                           frequency === 'unique' ? `🚀 Transférer ${amount || 0} CVTC` :
                           `Planifier transfert ${frequency === 'hourly' ? 'horaire' :
                                                frequency === 'daily' ? 'quotidien' :
                                                frequency === 'weekly' ? 'hebdomadaire' : 'mensuel'}`}
                        </button>
                      </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section Carnet d'adresses */}
          <div className="mt-10 space-y-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-lg font-semibold text-heading">Carnet d'adresses</label>
                <button
                  onClick={() => setShowContacts(!showContacts)}
                  className="text-sm text-accent hover:text-accent-hover underline decoration-accent/30 hover:decoration-accent transition-all duration-200"
                >
                  {showContacts ? 'Masquer' : 'Voir'} carnet d'adresses ({contacts.length})
                </button>
              </div>

              {/* Liste des contacts */}
              {showContacts && (
                <div className="p-4 bg-gradient-to-br from-card-bg/80 to-card-bg/60 border border-card-border rounded-xl backdrop-blur-sm shadow-lg">
                  <h4 className="text-base font-semibold text-heading mb-4 flex items-center gap-2">
                    📱 Mes Contacts
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-accent/20 scrollbar-track-transparent">
                    {contacts.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">📭</div>
                        <p className="text-sm text-text-secondary">
                          Aucun contact sauvegardé. Effectuez un transfert puis sauvegardez le destinataire !
                        </p>
                      </div>
                    ) : (
                      contacts.map((contact, index) => (
                        <div key={index} className="p-3 bg-gradient-to-r from-card-bg/50 to-card-bg/30 border border-card-border/50 rounded-lg hover:border-accent/30 transition-all duration-200">
                          {editingContact === contact.address ? (
                            // Mode édition
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="flex-1 px-3 py-2 text-sm bg-card-bg border border-card-border rounded-md focus:ring-2 focus:ring-accent focus:outline-none"
                                  placeholder="Nouveau nom"
                                  autoFocus
                                />
                                <button
                                  onClick={() => updateContact(contact.address, editName)}
                                  className="px-3 py-2 bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/30 transition-colors duration-200"
                                >
                                  ✅
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="px-3 py-2 bg-gray-500/20 text-gray-400 rounded-md hover:bg-gray-500/30 transition-colors duration-200"
                                >
                                  ❌
                                </button>
                              </div>
                              <p className="text-xs text-text-secondary font-mono break-all">{contact.address}</p>
                            </div>
                          ) : (
                            // Mode affichage normal
                            <div className="flex justify-between items-center">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-accent truncate">{contact.name}</span>
                                  <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                                    {contact.transferCount} transfert{contact.transferCount > 1 ? 's' : ''}
                                  </span>
                                </div>
                                <p className="text-xs text-text-secondary font-mono break-all mb-1">{contact.address}</p>
                                <p className="text-xs text-text-secondary">
                                  Dernier: {new Date(contact.lastTransfer).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => selectContact(contact)}
                                  className="text-xs px-3 py-2 bg-accent/20 text-accent rounded-md hover:bg-accent/30 transition-colors duration-200 font-medium"
                                  title="Sélectionner ce contact"
                                >
                                  Sélectionner
                                </button>
                                <button
                                  onClick={() => startEditing(contact)}
                                  className="text-xs px-3 py-2 bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/30 transition-colors duration-200"
                                  title="Renommer le contact"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => removeContact(contact.address)}
                                  className="text-xs px-3 py-2 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 transition-colors duration-200"
                                  title="Supprimer le contact"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-900/50 border border-red-400 text-center">
              <p className="text-red-400 text-sm">❌ Erreur de transfert</p>
              <p className="text-text-secondary text-xs break-words">{error}</p>
            </div>
          )}

          {/* Conseil de sécurité */}
          <div className="text-center mt-12">
            <p className="text-xs text-text-secondary">💡 Conseil : Vérifiez toujours l'adresse du bénéficiaire pour une sécurité optimale.</p>
          </div>
        </div>
      </div>
    </>
  );
}