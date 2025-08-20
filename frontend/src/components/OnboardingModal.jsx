import React from 'react';
import { ShieldCheck, X } from 'lucide-react';

export default function OnboardingModal({ onAccept, onDecline }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card-bg border border-card-border rounded-lg shadow-xl p-8 max-w-md w-full m-4">
        
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <ShieldCheck className="text-accent" size={32} />
            <h2 className="text-xl font-bold text-heading">Bienvenue sur Ocean Bleu</h2>
          </div>
          <button onClick={onDecline} className="text-text-secondary hover:text-text-primary">
            <X size={24} />
          </button>
        </div>

        <div className="mt-6 space-y-4 text-text-secondary max-h-60 overflow-y-auto pr-2">
          <p>En continuant, vous acceptez de démarrer le processus d'onboarding.</p>
          <p>Ce processus implique l'interaction avec un smart contract pour lier votre portefeuille à notre écosystème. Chaque jour, une opération automatisée sera effectuée en votre nom pour échanger une petite quantité de BNB contre des jetons CVTC, conformément à notre stratégie de croissance et de distribution.</p>
          <p className="font-semibold text-text-primary">Conditions principales :</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Vous autorisez un swap quotidien de 0.0002 BNB vers le jeton CVTC.</li>
            <li>Des frais de 1% seront appliqués sur chaque opération.</li>
            <li>Votre participation est soumise aux conditions de la whitelist du contrat.</li>
          </ul>
          <p>Vous pouvez révoquer cet accès à tout moment depuis les paramètres de votre portefeuille.</p>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button onClick={onDecline} className="button button-secondary">
            Refuser
          </button>
          <button onClick={onAccept} className="button">
            Accepter & Démarrer
          </button>
        </div>

      </div>
    </div>
  );
}
