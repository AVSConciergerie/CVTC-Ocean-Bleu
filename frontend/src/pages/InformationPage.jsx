import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function InformationPage() {
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    const termsStatus = localStorage.getItem('termsAccepted');
    const onboardingStatusValue = localStorage.getItem('onboardingStatus');

    // Vérifier si les conditions générales ont été acceptées
    if (termsStatus === 'true') {
      setTermsAccepted(true);
    }

    // Vérifier le statut d'onboarding
    if (onboardingStatusValue === 'accepted') {
      setOnboardingStatus('réussi');
    }
  }, []);

  return (
    <div className="p-8 text-text-primary relative">
      <Link to="/" className="absolute top-4 left-4 text-sm text-text-secondary hover:text-text-primary">
        Accueil
      </Link>
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary mb-8">
        <ArrowLeft size={18} />
        Retour au Dashboard
      </Link>
      
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-heading">Information</h1>
          <p className="mt-2">
            Détails techniques, contrats et statut de votre compte.
          </p>
        </div>

        <div className="border-t border-card-border my-8"></div>

        <div>
          <h2 className="text-xl font-bold text-heading">Statut de l'Onboarding</h2>
          {termsAccepted && onboardingStatus === 'réussi' ? (
            <div className="mt-4 flex items-center gap-3 text-green-400 bg-green-900/50 border border-green-400/30 rounded-lg p-4">
              <CheckCircle size={24} />
              <p className="font-semibold">Onboarding réussi ! Votre compte est pleinement actif.</p>
            </div>
          ) : !termsAccepted ? (
            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
              <p className="text-yellow-200">
                ⚠️ Veuillez d'abord accepter les conditions d'utilisation depuis le Dashboard pour finaliser votre onboarding.
              </p>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
              <p className="text-blue-200">
                🔄 Onboarding en cours... Les conditions ont été acceptées, l'initialisation se termine.
              </p>
            </div>
          )}
        </div>

         {/* Ici, on pourra ajouter les adresses des contrats plus tard */}
      </div>
    </div>
  );
}
