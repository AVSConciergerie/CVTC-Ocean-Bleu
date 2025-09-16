import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  createSmartAccountClient,
  toSafeSmartAccount,
} from "permissionless";
import {
  createPimlicoClient,
  createPimlicoPaymasterClient,
} from "permissionless/clients/pimlico";
import { entryPoint07Address } from "viem/account-abstraction";

const PimlicoOnboardingExample = () => {
  const [status, setStatus] = useState('idle'); // idle, connecting, onboarding, success, error
  const [userAddress, setUserAddress] = useState('');
  const [smartAccountAddress, setSmartAccountAddress] = useState('');
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [error, setError] = useState('');

  // Configuration Pimlico
  const PIMLICO_API_KEY = import.meta.env.VITE_PIMLICO_API_KEY;
  const BSC_TESTNET_RPC = "https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7";

  // Adresses des contrats déployés
  const CONTRACTS = {
    paymaster: "0xa5e6b56FF29a7d0b19946DB836E31D88E41CAdE2", // NOUVEL paymaster corrigé
    onboarding: "0xf3af730B6eaF257EC44b244d56F3073Fd6B593c5",
    cvtcToken: "0x532FC49071656C16311F2f89E6e41C53243355D3"
  };

  useEffect(() => {
    initializeWallet();
  }, []);

  const initializeWallet = async () => {
    try {
      setStatus('connecting');

      // Vérifier si MetaMask est disponible
      if (!window.ethereum) {
        throw new Error("MetaMask n'est pas installé");
      }

      // Demander l'accès au wallet
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setUserAddress(address);
      console.log("✅ Wallet connecté:", address);

      setStatus('idle');
    } catch (err) {
      console.error("❌ Erreur de connexion wallet:", err);
      setError(err.message);
      setStatus('error');
    }
  };

  const createSmartAccount = async () => {
    try {
      setStatus('connecting');

      // Configuration Pimlico pour BSC Testnet
      const pimlicoClient = createPimlicoClient({
        transport: { request: { url: `https://api.pimlico.io/v2/97/rpc?apikey=${PIMLICO_API_KEY}` } },
        entryPoint: {
          address: entryPoint07Address,
          version: "0.7",
        },
      });

      const paymasterClient = createPimlicoPaymasterClient({
        transport: { request: { url: `https://api.pimlico.io/v2/97/rpc?apikey=${PIMLICO_API_KEY}` } },
        entryPoint: {
          address: entryPoint07Address,
          version: "0.7",
        },
      });

      // Obtenir le signer du wallet
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Créer le Smart Account
      const smartAccount = await toSafeSmartAccount({
        client: pimlicoClient,
        owners: [signer],
        version: "1.4.1",
      });

      setSmartAccountAddress(smartAccount.address);
      console.log("✅ Smart Account créé:", smartAccount.address);

      // Créer le client Smart Account avec paymaster
      const smartAccountClient = createSmartAccountClient({
        account: smartAccount,
        chain: {
          id: 97,
          name: "Binance Smart Chain Testnet",
          nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
          rpcUrls: {
            default: { http: [BSC_TESTNET_RPC] },
          },
          blockExplorers: {
            default: { name: "BscScan", url: "https://testnet.bscscan.com" },
          },
        },
        bundlerTransport: { request: { url: `https://api.pimlico.io/v2/97/rpc?apikey=${PIMLICO_API_KEY}` } },
        paymaster: paymasterClient,
        userOperation: {
          estimateFeesPerGas: async () => {
            return (await pimlicoClient.getUserOperationGasPrice()).fast;
          },
        },
      });

      setStatus('ready');
      return smartAccountClient;

    } catch (err) {
      console.error("❌ Erreur création Smart Account:", err);
      setError(err.message);
      setStatus('error');
      return null;
    }
  };

  const startOnboarding = async () => {
    try {
      setStatus('onboarding');

      // Créer le Smart Account Client
      const smartAccountClient = await createSmartAccount();
      if (!smartAccountClient) return;

      // Préparer l'appel au contrat d'onboarding
      const onboardingContract = new ethers.Contract(
        CONTRACTS.onboarding,
        [
          "function acceptOnboardingTerms() external",
          "function getUserOnboardingStatus(address user) external view returns (bool isActive, bool completed, uint256 daysRemaining, uint256 cvtcAccumulated, uint8 currentPalier, uint256 totalRepaid)"
        ],
        smartAccountClient
      );

      console.log("📤 Envoi de la transaction gasless...");

      // Envoyer la transaction gasless
      const userOpHash = await smartAccountClient.sendUserOperation({
        calls: [{
          to: CONTRACTS.onboarding,
          data: onboardingContract.interface.encodeFunctionData("acceptOnboardingTerms"),
          value: 0n,
        }],
      });

      console.log("✅ Transaction gasless envoyée!");
      console.log("Hash UserOperation:", userOpHash);

      // Attendre la confirmation
      console.log("⏳ Attente de la confirmation...");
      const pimlicoClient = createPimlicoClient({
        transport: { request: { url: `https://api.pimlico.io/v2/97/rpc?apikey=${PIMLICO_API_KEY}` } },
        entryPoint: {
          address: entryPoint07Address,
          version: "0.7",
        },
      });

      const receipt = await pimlicoClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      console.log("🎉 Transaction confirmée!");
      console.log("Hash de transaction:", receipt.receipt.transactionHash);

      // Vérifier le statut d'onboarding
      await checkOnboardingStatus();

      setStatus('success');

    } catch (err) {
      console.error("❌ Erreur lors de l'onboarding:", err);
      setError(err.message);
      setStatus('error');
    }
  };

  const checkOnboardingStatus = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const onboardingContract = new ethers.Contract(
        CONTRACTS.onboarding,
        [
          "function getUserOnboardingStatus(address user) external view returns (bool isActive, bool completed, uint256 daysRemaining, uint256 cvtcAccumulated, uint8 currentPalier, uint256 totalRepaid)"
        ],
        provider
      );

      const status = await onboardingContract.getUserOnboardingStatus(userAddress);
      setOnboardingStatus({
        isActive: status[0],
        completed: status[1],
        daysRemaining: status[2].toString(),
        cvtcAccumulated: ethers.formatEther(status[3]),
        currentPalier: status[4],
        totalRepaid: ethers.formatEther(status[5])
      });

    } catch (err) {
      console.error("❌ Erreur vérification statut:", err);
    }
  };

  const renderStatus = () => {
    switch (status) {
      case 'idle':
        return (
          <div className="status-card">
            <h3>🔗 Wallet Connecté</h3>
            <p>Adresse: {userAddress}</p>
            <button onClick={startOnboarding} className="onboarding-btn">
              🚀 Démarrer l'Onboarding Gasless
            </button>
          </div>
        );

      case 'connecting':
        return (
          <div className="status-card">
            <h3>🔄 Connexion en cours...</h3>
            <div className="spinner"></div>
          </div>
        );

      case 'onboarding':
        return (
          <div className="status-card">
            <h3>📝 Onboarding en cours...</h3>
            <p>Transaction gasless en cours</p>
            <div className="spinner"></div>
          </div>
        );

      case 'success':
        return (
          <div className="status-card success">
            <h3>🎉 Onboarding Réussi !</h3>
            <p>Vous avez rejoint le programme CVTC sans frais de gas !</p>
            {onboardingStatus && (
              <div className="status-details">
                <p><strong>Statut:</strong> {onboardingStatus.isActive ? 'Actif' : 'Inactif'}</p>
                <p><strong>Jours restants:</strong> {onboardingStatus.daysRemaining}</p>
                <p><strong>CVTC accumulés:</strong> {onboardingStatus.cvtcAccumulated}</p>
                <p><strong>Palier actuel:</strong> {onboardingStatus.currentPalier}/3</p>
                <p><strong>Prêt reçu:</strong> 0,30 BNB</p>
              </div>
            )}
          </div>
        );

      case 'error':
        return (
          <div className="status-card error">
            <h3>❌ Erreur</h3>
            <p>{error}</p>
            <button onClick={() => setStatus('idle')} className="retry-btn">
              Réessayer
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="pimlico-onboarding-container">
      <h1>🎯 Exemple Pimlico - Onboarding Gasless</h1>

      <div className="info-section">
        <h2>💡 Comment ça marche</h2>
        <div className="steps">
          <div className="step">
            <span className="step-number">1</span>
            <p>Connexion wallet MetaMask</p>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <p>Création Smart Account Pimlico</p>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <p>Acceptation CGU (1 clic)</p>
          </div>
          <div className="step">
            <span className="step-number">4</span>
            <p>Réception prêt 0,30€ BNB</p>
          </div>
          <div className="step">
            <span className="step-number">5</span>
            <p>Swaps quotidiens automatiques</p>
          </div>
        </div>
      </div>

      <div className="demo-section">
        <h2>🚀 Démonstration Live</h2>
        {renderStatus()}
      </div>

      <div className="technical-details">
        <h2>🔧 Détails Techniques</h2>
        <div className="contracts-info">
          <h3>Adresses des Contrats (BSC Testnet)</h3>
          <ul>
            <li><strong>Paymaster:</strong> {CONTRACTS.paymaster}</li>
            <li><strong>Onboarding:</strong> {CONTRACTS.onboarding}</li>
            <li><strong>CVTC Token:</strong> {CONTRACTS.cvtcToken}</li>
            <li><strong>Smart Account:</strong> {smartAccountAddress || 'À créer'}</li>
          </ul>
        </div>

        <div className="features-list">
          <h3>✨ Fonctionnalités Pimlico</h3>
          <ul>
            <li>✅ Transactions 100% gasless</li>
            <li>✅ Paiement en CVTC tokens</li>
            <li>✅ Smart Account sécurisé</li>
            <li>✅ Intégration ERC-4337</li>
            <li>✅ Support BSC Testnet/Mainnet</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .pimlico-onboarding-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        .info-section, .demo-section, .technical-details {
          margin: 30px 0;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }

        .steps {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }

        .step {
          text-align: center;
          flex: 1;
        }

        .step-number {
          display: block;
          width: 40px;
          height: 40px;
          background: #007bff;
          color: white;
          border-radius: 50%;
          line-height: 40px;
          margin: 0 auto 10px;
          font-weight: bold;
        }

        .status-card {
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          background: #f8f9fa;
        }

        .status-card.success {
          background: #d4edda;
          border: 1px solid #c3e6cb;
        }

        .status-card.error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
        }

        .onboarding-btn, .retry-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          margin-top: 15px;
        }

        .onboarding-btn:hover {
          background: #0056b3;
        }

        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .status-details {
          margin-top: 20px;
          text-align: left;
          background: white;
          padding: 15px;
          border-radius: 6px;
        }

        .contracts-info ul, .features-list ul {
          list-style: none;
          padding: 0;
        }

        .contracts-info li, .features-list li {
          padding: 5px 0;
          border-bottom: 1px solid #eee;
        }

        .contracts-info li:last-child, .features-list li:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
};

export default PimlicoOnboardingExample;