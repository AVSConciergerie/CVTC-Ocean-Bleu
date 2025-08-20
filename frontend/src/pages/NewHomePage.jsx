import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import './HomePage.css'; // On réutilise les styles existants

const NewHomePage = () => {
  const navigate = useNavigate();
  const { ready, authenticated, login } = usePrivy();

  // Ce hook redirige vers le dashboard si l'utilisateur est déjà connecté
  useEffect(() => {
    if (ready && authenticated) {
      navigate('/dashboard');
    }
  }, [ready, authenticated, navigate]);

  // Fonction unique pour le login/signup, appelée par tous les boutons
  const handleLogin = () => {
    login();
  };

  // On attend que Privy soit prêt pour éviter un affichage bref de la page avant la redirection
  if (!ready) {
    return (
      <div className="loading-container">
        <span>Chargement...</span>
        <div className="spinner"></div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, on affiche la page.
  // S'il est connecté, le hook ci-dessus l'a déjà redirigé.
  return (
    <div className="main-container dark">
      <header>
        <img src="/assets/logo.svg" className="logo" alt="Logo de l’entreprise" />
      </header>

      <main>
        <h1>Votre porte d'entrée simple vers le Web3</h1>
        <div className="slogan">Loin du jargon, proche de l’usage.</div>

        <div className="buttons">
          <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Pour commencer, créez votre portefeuille :</p>
          <button onClick={handleLogin}>Particulier</button>
          <button onClick={handleLogin}>Mineur / Sous responsabilité</button>
          <button onClick={handleLogin}>Pro / Organisation</button>
          
          <hr style={{ width: '50%', margin: '2rem auto', borderColor: 'rgba(0, 255, 255, 0.2)' }} />
          
          <p style={{ opacity: 0.8 }}>Ou si vous avez déjà un compte :</p>
          <button className="link-login" onClick={handleLogin}>
            Se connecter
          </button>
        </div>
      </main>
    </div>
  );
};

export default NewHomePage;
