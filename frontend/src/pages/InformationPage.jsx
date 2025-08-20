import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function InformationPage() {
  const [onboardingStatus, setOnboardingStatus] = useState(null);

  useEffect(() => {
    const status = localStorage.getItem('onboardingStatus');
    if (status === 'accepted') {
      setOnboardingStatus('réussi');
    }
  }, []);

  return (
    <div className="p-8 text-text-primary">
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
          {onboardingStatus === 'réussi' ? (
            <div className="mt-4 flex items-center gap-3 text-green-400 bg-green-900/50 border border-green-400/30 rounded-lg p-4">
              <CheckCircle size={24} />
              <p className="font-semibold">Onboarding réussi ! Votre compte est pleinement actif.</p>
            </div>
          ) : (
            <p className="mt-4 text-text-secondary">
              Votre onboarding n'est pas encore finalisé. Veuillez accepter les conditions lors de votre première connexion.
            </p>
          )}
        </div>

         {/* Ici, on pourra ajouter les adresses des contrats plus tard */}
      </div>
    </div>
  );
}
