 import React, { useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { usePrivy } from '@privy-io/react-auth';
// import './LoginPage.css'; // Fichier à créer si des styles spécifiques sont nécessaires

 const LoginPage = () => {
   const navigate = useNavigate();
   const { ready, authenticated, login } = usePrivy();

   // Ce hook gère la redirection si l'utilisateur est déjà connecté.
   useEffect(() => {
     if (ready && authenticated) {
       navigate('/dashboard');
     }
   }, [ready, authenticated, navigate]);

   // Affiche un message de chargement tant que Privy n'est pas initialisé.
   if (!ready) {
     return <div className="loading-container">Chargement...</div>;
   }

   // Si l'utilisateur n'est pas authentifié, on affiche la page de connexion.
   // Le hook ci-dessus empêche un utilisateur connecté de voir cette page.
   return (
     <div className="login-container onboarding-container"> {/* Réutilisation des styles de l'onboarding */}
        <header style={{position: 'relative'}}>
          <a href="/" style={{textDecoration: 'none', position: 'relative'}}>
              <img src="/assets/logo.svg" className="logo" alt="Logo de l'entreprise" />
              <span style={{position: 'absolute', top: '10px', left: '100px', textDecoration: 'none', color: '#ccc', fontSize: '0.9rem'}}>
                Accueil
              </span>
          </a>
        </header>
       <main style={{textAlign: 'center'}}>
         <h1>Accédez à votre portefeuille</h1>
         <p style={{maxWidth: '400px', margin: '1rem auto 2rem'}}>Connectez-vous avec votre email pour accéder à votre tableau de bord.</p>
         <button className="main-login-button" onClick={login} style={{padding: '1rem 2rem', borderRadius: '50px', fontSize: '1.2rem'}}>
           Se connecter
         </button>
       </main>
     </div>
   );
 };

 export default LoginPage;