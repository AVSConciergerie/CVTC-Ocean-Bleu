import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { usePimlico } from '../context/PimlicoContext';
import { Crown, Zap, Shield, TrendingUp, Clock, Euro } from 'lucide-react';

export default function PremiumSubscription() {
  const { user } = usePrivy();
  const { smartAccount } = usePimlico();
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState(null);
  const [personalReserve, setPersonalReserve] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);

  // Simuler les données (à remplacer par les vraies données du contrat)
  useEffect(() => {
    // Vérifier si l'utilisateur est premium
    const premiumStatus = localStorage.getItem('premiumStatus');
    if (premiumStatus === 'active') {
      setIsPremium(true);
      const endDate = localStorage.getItem('premiumEndDate');
      if (endDate) {
        setSubscriptionEnd(new Date(endDate));
      }
      const reserve = localStorage.getItem('personalReserve') || '0.1';
      setPersonalReserve(parseFloat(reserve));
    }

    // Simuler l'historique des transactions
    setTransactionHistory([
      { id: 1, amount: 10, discount: 0.02, date: '2025-09-05', status: 'success' },
      { id: 2, amount: 25, discount: 0.02, date: '2025-09-03', status: 'success' },
      { id: 3, amount: 5, discount: 0.02, date: '2025-09-01', status: 'success' },
    ]);
  }, []);

  const handleSubscribe = async () => {
    if (!smartAccount) {
      alert('Smart Account requis pour l\'abonnement premium');
      return;
    }

    setIsLoading(true);
    try {
      // Simuler l'abonnement (à remplacer par l'appel réel au contrat)
      const subscriptionPrice = '5000000000000000000'; // 5 BNB en wei

      const txHash = await smartAccount.sendTransaction({
        to: '0x0000000000000000000000000000000000000000', // Adresse du contrat premium
        value: subscriptionPrice,
        data: '0x', // Encodage de la fonction subscribePremium()
      });

      console.log('Transaction d\'abonnement:', txHash);

      // Simuler la réussite
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      localStorage.setItem('premiumStatus', 'active');
      localStorage.setItem('premiumEndDate', endDate.toISOString());
      localStorage.setItem('personalReserve', '0.1');

      setIsPremium(true);
      setSubscriptionEnd(endDate);
      setPersonalReserve(0.1);

      alert('🎉 Abonnement premium activé avec succès !');

    } catch (error) {
      console.error('Erreur lors de l\'abonnement:', error);
      alert('Erreur lors de l\'abonnement. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatBNB = (amount) => `${amount.toFixed(4)} BNB`;
  const formatDate = (date) => date.toLocaleDateString('fr-FR');

  if (isPremium) {
    return (
      <div className="space-y-6">
        {/* Header Premium */}
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-full">
              <Crown className="text-purple-400" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-purple-400">Client Premium</h2>
              <p className="text-purple-200">Accès complet aux fonctionnalités avancées</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-purple-400" size={20} />
                <span className="text-sm text-purple-200">Expiration</span>
              </div>
              <p className="text-lg font-semibold text-white">
                {subscriptionEnd ? formatDate(subscriptionEnd) : 'N/A'}
              </p>
            </div>

            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="text-green-400" size={20} />
                <span className="text-sm text-green-200">Réserve Active</span>
              </div>
              <p className="text-lg font-semibold text-white">
                {formatBNB(personalReserve)}
              </p>
            </div>

            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-blue-400" size={20} />
                <span className="text-sm text-blue-200">Transactions</span>
              </div>
              <p className="text-lg font-semibold text-white">
                {transactionHistory.length}
              </p>
            </div>
          </div>
        </div>

        {/* Avantages Premium */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card-bg border border-card-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-heading mb-4 flex items-center gap-2">
              <Shield className="text-green-400" size={20} />
              Réserve Automatique
            </h3>
            <ul className="space-y-2 text-text-secondary">
              <li>• Recharge automatique des fonds</li>
              <li>• Transactions spontanées sans frais</li>
              <li>• Limite de réserve: 0.1 - 1 BNB</li>
              <li>• Reconstitution via les transactions</li>
            </ul>
          </div>

          <div className="bg-card-bg border border-card-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-heading mb-4 flex items-center gap-2">
              <Euro className="text-yellow-400" size={20} />
              Système de Remises
            </h3>
            <ul className="space-y-2 text-text-secondary">
              <li>• 2 centimes de remise par transaction</li>
              <li>• Applicable sur tous les paiements</li>
              <li>• Remise proportionnelle au réseau</li>
              <li>• Économie garantie sur chaque achat</li>
            </ul>
          </div>
        </div>

        {/* Historique des Transactions */}
        <div className="bg-card-bg border border-card-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-heading mb-4">Historique des Transactions</h3>
          <div className="space-y-3">
            {transactionHistory.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3">
                <div>
                  <p className="font-medium text-white">{formatBNB(tx.amount)}</p>
                  <p className="text-sm text-text-secondary">{formatDate(new Date(tx.date))}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-400">-{formatBNB(tx.discount)}</p>
                  <p className="text-sm text-green-200">remise</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Interface d'abonnement
  return (
    <div className="space-y-6">
      {/* Proposition d'abonnement */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-8 text-center">
        <div className="mb-6">
          <Crown className="text-purple-400 mx-auto mb-4" size={48} />
          <h2 className="text-3xl font-bold text-heading mb-2">Devenez Client Premium</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Accédez à des fonctionnalités avancées et bénéficiez d'économies automatiques
            sur toutes vos transactions avec notre système de réserve intelligente.
          </p>
        </div>

        {/* Prix et durée */}
        <div className="bg-black/30 rounded-lg p-6 mb-6 max-w-md mx-auto">
          <div className="text-4xl font-bold text-purple-400 mb-2">5 €</div>
          <div className="text-text-secondary mb-4">pour 365 jours complets</div>
          <div className="text-sm text-green-400">+ Réserve automatique incluse</div>
        </div>

        {/* Avantages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
          <div className="bg-card-bg border border-card-border rounded-lg p-4">
            <Zap className="text-yellow-400 mx-auto mb-2" size={24} />
            <h3 className="font-semibold text-heading mb-1">Réserve Auto</h3>
            <p className="text-sm text-text-secondary">0.1 BNB de réserve rechargée automatiquement</p>
          </div>

          <div className="bg-card-bg border border-card-border rounded-lg p-4">
            <Euro className="text-green-400 mx-auto mb-2" size={24} />
            <h3 className="font-semibold text-heading mb-1">Remises Auto</h3>
            <p className="text-sm text-text-secondary">2 centimes d'économie par transaction</p>
          </div>

          <div className="bg-card-bg border border-card-border rounded-lg p-4">
            <TrendingUp className="text-blue-400 mx-auto mb-2" size={24} />
            <h3 className="font-semibold text-heading mb-1">Économie</h3>
            <p className="text-sm text-text-secondary">Plus d'utilisateurs = plus d'économies</p>
          </div>
        </div>

        {/* Bouton d'abonnement */}
        <button
          onClick={handleSubscribe}
          disabled={isLoading || !smartAccount}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-4 px-8 rounded-lg transition-colors flex items-center gap-2 mx-auto"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Activation en cours...
            </>
          ) : (
            <>
              <Crown size={20} />
              Devenir Client Premium
            </>
          )}
        </button>

        {!smartAccount && (
          <p className="text-yellow-400 mt-4 text-sm">
            ⚠️ Smart Account requis pour l'abonnement premium
          </p>
        )}
      </div>

      {/* Explication du système */}
      <div className="bg-card-bg border border-card-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-heading mb-4">Comment ça marche ?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-purple-400 mb-2">1. Réserve Automatique</h4>
            <p className="text-sm text-text-secondary mb-4">
              Votre réserve de 0.1 BNB se recharge automatiquement via les transactions
              du réseau et les fluctuations de valeur du CVTC.
            </p>

            <h4 className="font-semibold text-purple-400 mb-2">2. Remises Garanties</h4>
            <p className="text-sm text-text-secondary">
              Pour chaque transaction, vous bénéficiez d'une remise de 2 centimes :
              1 centime avant le swap + 1 centime après le swap.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-purple-400 mb-2">3. Effet Réseau</h4>
            <p className="text-sm text-text-secondary mb-4">
              Plus il y a d'utilisateurs premium, plus les remises sont importantes
              grâce à l'effet viral du système.
            </p>

            <h4 className="font-semibold text-purple-400 mb-2">4. Économie Réelle</h4>
            <p className="text-sm text-text-secondary">
              Sur un paiement de 10€, vous économisez 0.02€. Sur 100 paiements,
              c'est 2€ d'économies garanties !
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}