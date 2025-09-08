import React from 'react';
import { ShieldCheck, X, FileText, AlertTriangle } from 'lucide-react';

export default function TermsModal({ onAccept, onDecline }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card-bg border border-card-border rounded-lg shadow-2xl p-8 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">

        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/20 rounded-full">
              <FileText className="text-accent" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-heading">Conditions d'Utilisation</h2>
              <p className="text-text-secondary text-sm">Obligatoire pour accéder à Ocean Bleu</p>
            </div>
          </div>
          <button
            onClick={onDecline}
            className="text-text-secondary hover:text-text-primary transition-colors p-2 rounded-full hover:bg-gray-800/50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6 text-text-secondary">
          <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-yellow-400 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <h3 className="text-yellow-400 font-semibold mb-2">⚠️ Accord Obligatoire</h3>
                <p className="text-sm">
                  L'accès à Ocean Bleu nécessite l'acceptation complète de ces conditions.
                  Sans cette acceptation, vous ne pourrez pas utiliser la plateforme.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-heading flex items-center gap-2">
              <ShieldCheck className="text-accent" size={20} />
              Conditions Générales d'Utilisation
            </h3>

            <div className="space-y-4 text-sm leading-relaxed">
              <div>
                <h4 className="font-semibold text-text-primary mb-2">1. Acceptation des Conditions</h4>
                <p>
                  En accédant et en utilisant Ocean Bleu, vous acceptez d'être lié par les présentes
                  conditions d'utilisation. Si vous n'acceptez pas ces conditions, vous ne devez
                  pas utiliser cette plateforme.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-text-primary mb-2">2. Service d'Onboarding Automatique</h4>
                <p>
                  Ocean Bleu propose un programme d'onboarding automatique de 30 jours maximum.
                  Ce programme implique des échanges quotidiens automatisés de tokens selon
                  les conditions suivantes :
                </p>
                <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                  <li>Échange quotidien de 0.0002 BNB contre des tokens CVTC</li>
                  <li>Frais de service de 1% appliqués sur chaque opération</li>
                  <li>Programme limité à 30 jours maximum par utilisateur</li>
                  <li>Exécution automatique sans intervention manuelle requise</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-text-primary mb-2">3. Responsabilités de l'Utilisateur</h4>
                <p>
                  Vous êtes responsable de :
                </p>
                <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                  <li>La sécurité de votre portefeuille et de vos fonds</li>
                  <li>L'exactitude des informations fournies lors de l'inscription</li>
                  <li>Le respect des lois et réglementations applicables</li>
                  <li>L'utilisation appropriée de la plateforme</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-text-primary mb-2">4. Risques et Avertissements</h4>
                <p>
                  L'utilisation de Ocean Bleu implique des risques inhérents aux technologies
                  blockchain et aux cryptomonnaies :
                </p>
                <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                  <li>Volatilité des prix des cryptomonnaies</li>
                  <li>Risques techniques et de sécurité</li>
                  <li>Évolution réglementaire potentielle</li>
                  <li>Perte de fonds en cas de mauvaise utilisation</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-text-primary mb-2">5. Protection des Données</h4>
                <p>
                  Nous nous engageons à protéger vos données personnelles conformément
                  à notre politique de confidentialité. Les informations collectées sont
                  utilisées uniquement pour fournir et améliorer nos services.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-text-primary mb-2">6. Modification des Conditions</h4>
                <p>
                  Nous nous réservons le droit de modifier ces conditions à tout moment.
                  Les modifications prendront effet immédiatement après publication.
                  Votre utilisation continue de la plateforme constitue l'acceptation
                  des conditions modifiées.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-text-primary mb-2">7. Résiliation</h4>
                <p>
                  Vous pouvez cesser d'utiliser Ocean Bleu à tout moment. Nous nous
                  réservons le droit de suspendre ou résilier votre accès en cas de
                  violation des présentes conditions.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
            <h4 className="text-blue-400 font-semibold mb-2">Programme d'Onboarding Automatique</h4>
            <p className="text-sm text-blue-200">
              En acceptant ces conditions, vous autorisez Ocean Bleu à exécuter des
              opérations automatisées sur votre smart account pour faciliter votre
              intégration dans l'écosystème CVTC. Ces opérations sont conçues pour
              être bénéfiques et éducatives.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4 pt-6 border-t border-card-border">
          <button
            onClick={onDecline}
            className="px-6 py-3 text-text-secondary hover:text-text-primary transition-colors border border-card-border rounded-lg hover:bg-gray-800/50"
          >
            Refuser et Quitter
          </button>
          <button
            onClick={onAccept}
            className="px-8 py-3 bg-accent hover:bg-accent/80 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <ShieldCheck size={18} />
            Accepter les Conditions
          </button>
        </div>

      </div>
    </div>
  );
}