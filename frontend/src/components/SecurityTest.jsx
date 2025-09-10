import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function SecurityTest() {
  const { user, authenticated, ready } = usePrivy();
  const [testResults, setTestResults] = useState([]);

  const runSecurityTests = () => {
    const results = [];

    // Test 1: Authentification
    results.push({
      name: "Authentification Privy",
      status: authenticated ? "success" : "error",
      message: authenticated ? "Utilisateur authentifié" : "Utilisateur non authentifié",
      details: authenticated ? `User ID: ${user?.id}` : "Redirection vers /login requise"
    });

    // Test 2: Wallet connecté
    const hasWallet = user?.wallet?.address;
    results.push({
      name: "Wallet connecté",
      status: hasWallet ? "success" : "error",
      message: hasWallet ? "Wallet détecté" : "Aucun wallet connecté",
      details: hasWallet ? `Adresse: ${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` : "Connexion wallet requise"
    });

    // Test 3: URL directe bloquée
    const currentPath = window.location.pathname;
    const isProtectedRoute = ['/p2p-transfer', '/settings'].includes(currentPath);
    results.push({
      name: "Protection des routes",
      status: isProtectedRoute && !authenticated ? "success" : "warning",
      message: isProtectedRoute && !authenticated ? "Accès refusé correctement" : "Route accessible",
      details: isProtectedRoute ? "Route protégée - Authentification requise" : "Route publique"
    });

    // Test 4: Tentative d'accès direct
    results.push({
      name: "Accès direct aux fonctionnalités",
      status: authenticated && hasWallet ? "success" : "error",
      message: authenticated && hasWallet ? "Accès autorisé" : "Accès refusé",
      details: authenticated && hasWallet ? "Toutes les vérifications passées" : "Au moins une vérification échouée"
    });

    setTestResults(results);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Shield className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'border-green-500/50 bg-green-900/20';
      case 'error':
        return 'border-red-500/50 bg-red-900/20';
      case 'warning':
        return 'border-yellow-500/50 bg-yellow-900/20';
      default:
        return 'border-gray-500/50 bg-gray-900/20';
    }
  };

  if (!ready) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-2"></div>
        <p className="text-text-secondary">Chargement des tests de sécurité...</p>
      </div>
    );
  }

  return (
    <div className="bg-card-bg border border-card-border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-accent" />
        <h3 className="text-lg font-semibold text-heading">Tests de Sécurité</h3>
      </div>

      <div className="mb-4">
        <button
          onClick={runSecurityTests}
          className="button button-primary"
        >
          🔍 Lancer les tests de sécurité
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-heading">Résultats des tests :</h4>

          {testResults.map((test, index) => (
            <div key={index} className={`p-4 border rounded-lg ${getStatusColor(test.status)}`}>
              <div className="flex items-start gap-3">
                {getStatusIcon(test.status)}
                <div className="flex-1">
                  <h5 className="font-medium text-heading">{test.name}</h5>
                  <p className="text-sm text-text-secondary mt-1">{test.message}</p>
                  <p className="text-xs text-text-secondary mt-2 font-mono">{test.details}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="mt-6 p-4 bg-accent/10 border border-accent/30 rounded-lg">
            <h5 className="font-medium text-accent mb-2">📊 Résumé de sécurité :</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-text-secondary">Tests réussis :</span>
                <span className="ml-2 font-bold text-green-400">
                  {testResults.filter(t => t.status === 'success').length}
                </span>
              </div>
              <div>
                <span className="text-text-secondary">Tests échoués :</span>
                <span className="ml-2 font-bold text-red-400">
                  {testResults.filter(t => t.status === 'error').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
        <h5 className="font-medium text-yellow-400 mb-2">⚠️ Vérifications de sécurité :</h5>
        <ul className="text-sm text-yellow-300 space-y-1">
          <li>• Authentification Privy obligatoire</li>
          <li>• Wallet connecté requis pour les fonctionnalités sensibles</li>
          <li>• Protection automatique des routes sensibles</li>
          <li>• Redirection vers login si non authentifié</li>
          <li>• Vérification en temps réel de l'état d'authentification</li>
        </ul>
      </div>
    </div>
  );
}