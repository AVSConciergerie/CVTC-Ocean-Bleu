import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import OnboardingModal from '../components/OnboardingModal';
import TransactionHistory from '../components/TransactionHistory';
import { usePimlico } from '../context/PimlicoContext'; // Importation du hook Pimlico

export default function DashboardPage() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const { user } = usePrivy();
  const { smartAccountAddress, error } = usePimlico(); // Utilisation du hook Pimlico

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
            <h2 className="text-3xl font-bold text-heading">Bienvenue sur Ocean Bleu</h2>
            <p className="mt-4 text-text-primary">
              Votre passerelle entre le Web3 et le monde réel. Chez CVTC, nous pensons que la blockchain est un outil formidable, souvent perçu comme complexe. Notre mission est simple : amincir la frontière entre ces deux univers pour vous offrir des interactions fluides et intuitives.
            </p>
            
            {/* Section pour afficher le Smart Account */}
            <div className="mt-8 p-4 border border-gray-700 rounded-lg bg-gray-800/50">
              <h3 className="text-lg font-semibold text-heading">Votre Smart Account</h3>
              {error && <p className="mt-2 text-red-500">Erreur: {error}</p>}
              {smartAccountAddress ? (
                <p className="text-text-primary font-mono mt-2 break-all">
                  {smartAccountAddress}
                </p>
              ) : (
                <p className="text-text-secondary mt-2">Initialisation en cours...</p>
              )}
            </div>

            <p className="mt-8 text-text-secondary">
              Considérez cette plateforme comme votre tableau de bord personnel. C'est ici que vous gérez votre portefeuille, que vous interagissez avec notre écosystème et que vous découvrez comment le numérique peut enrichir votre quotidien. Explorez, expérimentez, et surtout, sentez-vous à l'aise.
            </p>
            
            {/* Section Historique des Transactions */}
            <div className="mt-8">
              <TransactionHistory smartAccountAddress={smartAccountAddress} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}