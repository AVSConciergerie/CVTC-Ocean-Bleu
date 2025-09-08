import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import OnboardingModal from '../components/OnboardingModal';
import TermsModal from '../components/TermsModal';
import TransactionHistory from '../components/TransactionHistory';
import { usePimlico } from '../context/PimlicoContext';
import { Copy } from 'lucide-react';

export default function DashboardPage() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { user } = usePrivy();
  const { smartAccountAddress, error } = usePimlico();
  const [isCopied, setIsCopied] = useState(false);
  const navigate = useNavigate();

  // Utilitaires pour gérer le localStorage
  const getTermsStatus = () => localStorage.getItem('termsAccepted') === 'true';
  const setTermsStatus = (accepted) => {
    if (accepted) {
      localStorage.setItem('termsAccepted', 'true');
    } else {
      localStorage.removeItem('termsAccepted');
    }
  };

  useEffect(() => {
    // VÉRIFICATION OBLIGATOIRE : Conditions d'utilisation acceptées ?
    if (!getTermsStatus()) {
      setShowTermsModal(true);
      return;
    }

    setTermsAccepted(true);

    // Logique existante pour l'onboarding (uniquement pour les nouveaux utilisateurs)
    if (user && user.createdAt) {
      const onboardingStatus = localStorage.getItem('onboardingStatus');
      if (onboardingStatus === 'accepted') return;

      const userCreationTime = new Date(user.createdAt).getTime();
      const fiveMinutes = 5 * 60 * 1000;
      const isNewUser = (Date.now() - userCreationTime) < fiveMinutes;

      if (isNewUser) setShowOnboardingModal(true);
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

  const handleAcceptTerms = () => {
    console.log("✅ Conditions d'utilisation acceptées");
    setTermsStatus(true);
    setShowTermsModal(false);
    setTermsAccepted(true);
  };

  const handleDeclineTerms = () => {
    console.log("❌ Conditions d'utilisation refusées - redirection vers login");
    // Nettoyer complètement le localStorage
    setTermsStatus(false);
    localStorage.removeItem('onboardingStatus');
    // Rediriger vers la page de login
    navigate('/login');
  };

  const handleCopy = () => {
    if (smartAccountAddress) {
      navigator.clipboard.writeText(smartAccountAddress);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-screen bg-transparent text-text-primary">
      {/* Modal des conditions d'utilisation - OBLIGATOIRE */}
      {showTermsModal && (
        <TermsModal
          onAccept={handleAcceptTerms}
          onDecline={handleDeclineTerms}
        />
      )}

      {/* Modal d'onboarding - seulement pour les nouveaux utilisateurs */}
      {showOnboardingModal && termsAccepted &&
        <OnboardingModal
          onAccept={handleAcceptOnboarding}
          onDecline={handleDeclineOnboarding}
        />
      }

      {/* Écran de blocage - affiché tant que les conditions ne sont pas acceptées */}
      {!termsAccepted && !showTermsModal && (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-text-secondary">Vérification des conditions d'utilisation...</p>
          </div>
        </div>
      )}

      {/* Contenu du dashboard - BLOQUÉ tant que les conditions ne sont pas acceptées */}
      {termsAccepted && (
        <>
          <Sidebar expanded={isSidebarExpanded} setExpanded={setIsSidebarExpanded} />

          <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'ml-64' : 'ml-20'}`}>
            <header className="p-8 border-b border-card-border">
              <h1 className="text-2xl font-bold text-heading">Dashboard</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Colonne de gauche : Introduction et Smart Account */}
                <div className="lg:col-span-2 space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-heading">Bienvenue sur Ocean Bleu</h2>
                    <p className="mt-2 text-text-secondary max-w-prose">
                      Votre passerelle entre le Web3 et le monde réel. Notre mission est simple : amincir la frontière entre ces deux univers pour vous offrir des interactions fluides et intuitives.
                    </p>
                  </div>

                  <div className="p-6 border border-card-border rounded-lg bg-card-bg">
                    <h3 className="text-lg font-semibold text-heading mb-3">Votre Smart Account</h3>
                    {error && <p className="text-sm text-red-400 bg-red-900/50 p-3 rounded-md">Erreur: {error}</p>}
                    {smartAccountAddress ? (
                      <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-md">
                        <code className="text-sm text-text-primary font-mono break-all">
                          {smartAccountAddress}
                        </code>
                        <button onClick={handleCopy} className="ml-4 p-2 text-text-secondary hover:text-accent transition-colors rounded-md">
                          {isCopied ? <span className="text-xs text-green-400">Copié!</span> : <Copy size={16} />}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-3 bg-gray-800/50 rounded-md">
                        <p className="text-text-secondary text-sm">Initialisation en cours...</p>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-text-secondary max-w-prose">
                    Considérez cette plateforme comme votre tableau de bord personnel. C'est ici que vous gérez votre portefeuille, interagissez avec notre écosystème et découvrez comment le numérique peut enrichir votre quotidien.
                  </p>
                </div>

                {/* Colonne de droite : Historique des Transactions */}
                <div className="lg:col-span-1">
                  <TransactionHistory smartAccountAddress={smartAccountAddress} />
                </div>
              </div>
            </main>
          </div>
        </>
      )}
    </div>
  );
}
