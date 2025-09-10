import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';

const ProtectedRoute = ({ children, requireWallet = false }) => {
  const { ready, authenticated, user } = usePrivy();
  const location = useLocation();

  // Attendre que Privy soit prêt
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-secondary">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Vérifier l'authentification
  if (!authenticated) {
    // Rediriger vers la page de connexion avec l'URL actuelle
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier si un wallet est requis
  if (requireWallet && (!user?.wallet || !user.wallet.address)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-card-bg border border-red-500/50 rounded-lg max-w-md">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-xl font-bold text-heading mb-2">Wallet requis</h2>
          <p className="text-text-secondary mb-4">
            Vous devez connecter un wallet pour accéder à cette fonctionnalité.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="button button-primary"
          >
            Se connecter avec un wallet
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;