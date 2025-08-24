import React, { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import OnboardingModal from '../components/OnboardingModal';
import { createSmartAccount } from '../services/accountService';

export default function DashboardPage() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [smartAccount, setSmartAccount] = useState(null);
  const { user } = usePrivy();
  const { wallets } = useWallets();

  useEffect(() => {
    const initializeSmartAccount = async () => {
      const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
      
      if (embeddedWallet) {
        try {
          // Ensure the wallet is on BSC Testnet (chainId 97)
          if (embeddedWallet.chainId !== 'eip155:97') {
            await embeddedWallet.switchChain(97);
          }
          
          const { smartAccount } = await createSmartAccount(embeddedWallet);
          setSmartAccount(smartAccount);
        } catch (error) {
          console.error("Erreur lors de l'initialisation du Smart Account:", error);
        }
      }
    };

    if (user && wallets.length > 0) {
      initializeSmartAccount();
    }
  }, [user, wallets]);

  useEffect(() => {
    if (user && user.createdAt) {
      const onboardingStatus = localStorage.getItem('onboardingStatus');
      if (onboardingStatus === 'accepted') {
        return;
      }

      const userCreationTime = new Date(user.createdAt).getTime();
      const fiveMinutes = 5 * 60 * 1000;
      const isNewUser = (Date.now() - userCreationTime) < fiveMinutes;

      if (isNewUser) {
        setShowOnboardingModal(true);
      }
    }
  }, [user]);

  const handleAcceptOnboarding = async () => {
    console.log("Onboarding accepté");
    if (user?.wallet?.address) {
      try {
        await axios.post('/api/onboarding/start', { userAddress: user.wallet.address });
        console.log("Appel API d'onboarding réussi.");
        localStorage.setItem('onboardingStatus', 'accepted');
      } catch (error) {
        console.error("Erreur lors de l'appel API d'onboarding:", error);
      }
    }
    setShowOnboardingModal(false);
  };

  const handleDeclineOnboarding = () => {
    console.log("Onboarding refusé");
    setShowOnboardingModal(false);
  };

  return (
    <div className="flex h-screen bg-transparent">
      {showOnboardingModal && 
        <OnboardingModal 
          onAccept={handleAcceptOnboarding} 
          onDecline={handleDeclineOnboarding} 
        />
      }
      <Sidebar expanded={isSidebarExpanded} setExpanded={setIsSidebarExpanded} />
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'ml-64' : 'ml-20'}`}>
        <header className="p-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl">
                        <h2 className="text-3xl font-bold text-heading">Dashboard Nettoyé et Opérationnel ! ✅</h2>
            <p className="mt-4 text-text-primary">
              Votre passerelle entre le Web3 et le monde réel. Chez CVTC, nous pensons que la blockchain est un outil formidable, souvent perçu comme complexe. Notre mission est simple : amincir la frontière entre ces deux univers pour vous offrir des interactions fluides et intuitives.
            </p>
            <p className="mt-4 text-text-secondary">
              Considérez cette plateforme comme votre tableau de bord personnel. C'est ici que vous gérez votre portefeuille, que vous interagissez avec notre écosystème et que vous découvrez comment le numérique peut enrichir votre quotidien. Explorez, expérimentez, et surtout, sentez-vous à l'aise.
            </p>

            <div className="mt-6 p-4 border border-gray-700 rounded-lg bg-gray-800/30">
              <h3 className="text-lg font-semibold text-heading">Votre Compte Intelligent</h3>
              {smartAccount ? (
                <p className="mt-2 text-text-primary font-mono bg-gray-900 p-3 rounded text-sm break-all">
                  {smartAccount.address}
                </p>
              ) : (
                <p className="mt-2 text-text-secondary">
                  Initialisation du compte intelligent...
                </p>
              )}
            </div>

            {/* Monerium Connection */}
            <div className="mt-6 p-4 border border-gray-700 rounded-lg bg-gray-800/30">
              <h3 className="text-lg font-semibold text-heading">Connexion Bancaire (IBAN)</h3>
              <p className="mt-2 text-text-primary">
                Connectez votre compte Monerium pour lier un IBAN à votre portefeuille. Cela vous permettra de transférer des fonds entre votre compte bancaire et votre portefeuille crypto.
              </p>
              {user?.wallet?.address ? (
                <a 
                  href={`http://localhost:4000/api/monerium/connect?walletAddress=${user.wallet.address}`}
                  className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Connecter avec Monerium
                </a>
              ) : (
                <p className="mt-4 text-text-secondary">
                  Votre adresse de portefeuille est nécessaire pour la connexion.
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}