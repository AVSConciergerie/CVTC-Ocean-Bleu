import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import './HomePage.css';
import { TextHoverEffect } from '../components/ui/TextHoverEffect';
import { AuroraBackground } from '../components/ui/AuroraBackground';

const HomePage = () => {
  const navigate = useNavigate();
  const { ready, authenticated } = usePrivy();

  // **LA CORRECTION EST ICI**
  // Ce hook vérifie si l'utilisateur est déjà connecté.
  // Si c'est le cas, il le redirige instantanément vers le bon dashboard.
  useEffect(() => {
    if (ready && authenticated) {
      navigate('/dashboard');
    }
  }, [ready, authenticated, navigate]);

  const handleProfileSelection = (mode) => {
    navigate(`/onboarding/${mode}`);
  };

  // On n'affiche la page que si l'utilisateur n'est pas connecté.
  // Si Privy n'est pas prêt, on peut afficher un loader pour éviter un flash de contenu.
  // if (!ready || authenticated) {
  //   return (
  //       <AuroraBackground>
  //           <div className="loading-container"><span>Chargement...</span><div className="spinner"></div></div>
  //       </AuroraBackground>
  //   );
  // }

  return (
    <div className="main-container dark">
      <header>
        <img src="/assets/logo.svg" className="logo" alt="Logo de l’entreprise" />
        <button className="link-login" onClick={() => navigate('/login')}>
          J'ai déjà un compte
        </button>
      </header>

      <main>
        <TextHoverEffect text="convercoin" />
        <h1>Votre porte d'entrée simple vers le Web3</h1>
        <div className="slogan">Loin du jargon, proche de l’usage.</div>

        <div className="buttons">
          <button onClick={() => handleProfileSelection('particulier')}>Particulier</button>
          <button onClick={() => handleProfileSelection('mineur')}>Mineur / Sous responsabilité</button>
          <button onClick={() => handleProfileSelection('pro')}>Pro / Organisation</button>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
