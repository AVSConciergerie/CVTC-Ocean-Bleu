import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { TextHoverEffect } from '../components/ui/TextHoverEffect';

const HomePage = () => {
  const navigate = useNavigate();
  const { ready, authenticated } = usePrivy();

  useEffect(() => {
    if (ready && authenticated) {
      navigate('/dashboard');
    }
  }, [ready, authenticated, navigate]);

  const handleProfileSelection = (mode) => {
    navigate(`/onboarding/${mode}`);
  };

  // Affiche un état de chargement tant que Privy n'est pas prêt
  // pour éviter un "flash" de la page de connexion si l'utilisateur est déjà authentifié.
  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-text-primary">
        <span>Chargement...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-text-primary dark">
       {/* --- Header --- */}
       <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
         <img src="/assets/logo.svg" className="h-8" alt="Logo CVTC" />
          <div className="flex gap-4">
            <button
              className="px-4 py-2 text-sm font-medium rounded-md hover:bg-link-hover-bg transition-colors"
              onClick={() => navigate('/login')}
            >
              J'ai déjà un compte
            </button>
          </div>
       </header>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col items-center justify-center text-center p-6">
        <div className="max-w-3xl">
          <TextHoverEffect text="convercoin" />
          
          <h1 className="text-4xl md:text-6xl font-bold text-heading mt-4">
            Votre porte d'entrée simple vers le Web3
          </h1>
          
          <p className="mt-4 text-lg text-text-secondary">
            Loin du jargon, proche de l’usage.
          </p>

          {/* --- Cartes de sélection de profil --- */}
          <div className="mt-12">
            <h2 className="text-lg font-medium text-heading mb-4">Choisissez votre profil pour commencer :</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ProfileCard 
                title="Particulier" 
                onClick={() => handleProfileSelection('particulier')} 
              />
              <ProfileCard 
                title="Mineur / Sous responsabilité" 
                onClick={() => handleProfileSelection('mineur')} 
              />
              <ProfileCard 
                title="Pro / Organisation" 
                onClick={() => handleProfileSelection('pro')} 
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Composant interne pour les cartes de profil pour garder le code principal propre
const ProfileCard = ({ title, onClick }) => (
  <button 
    onClick={onClick}
    className="p-8 rounded-lg bg-card-bg border border-card-border text-center hover:border-accent hover:scale-105 transition-all duration-300"
  >
    <h3 className="text-lg font-semibold text-heading">{title}</h3>
  </button>
);

export default HomePage;
