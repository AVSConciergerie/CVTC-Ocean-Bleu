import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Crown, Users, TrendingUp, DollarSign } from 'lucide-react';
import PremiumSubscription from '../components/PremiumSubscription';

export default function PremiumPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTransactions: 0,
    totalDiscounts: 0,
    networkReserve: 0
  });

  // Simuler les statistiques du réseau (à remplacer par les vraies données)
  useEffect(() => {
    // Simulation des métriques réseau
    setStats({
      totalUsers: 47,
      totalTransactions: 1250,
      totalDiscounts: 25.0, // en BNB
      networkReserve: 15.5 // en BNB
    });
  }, []);

  return (
    <div className="p-8 text-text-primary">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary mb-8">
        <ArrowLeft size={18} />
        Retour au Dashboard
      </Link>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-heading flex items-center gap-3">
            <Crown className="text-purple-400" size={36} />
            Ocean Bleu Premium
          </h1>
          <p className="mt-2 text-text-secondary max-w-3xl">
            Découvrez notre système révolutionnaire de transactions intelligentes.
            Économisez automatiquement sur chaque paiement grâce à notre réserve
            collective et bénéficiez d'avantages exclusifs réservés aux membres premium.
          </p>
        </div>

        {/* Statistiques du réseau */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border border-purple-500/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <Users className="text-purple-400" size={24} />
              <div>
                <p className="text-sm text-purple-200">Utilisateurs Premium</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              </div>
            </div>
            <p className="text-xs text-purple-300">Membres actifs</p>
          </div>

          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-500/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="text-blue-400" size={24} />
              <div>
                <p className="text-sm text-blue-200">Transactions</p>
                <p className="text-2xl font-bold text-white">{stats.totalTransactions.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-xs text-blue-300">Ce mois</p>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="text-green-400" size={24} />
              <div>
                <p className="text-sm text-green-200">Remises Distribuées</p>
                <p className="text-2xl font-bold text-white">{stats.totalDiscounts.toFixed(2)} BNB</p>
              </div>
            </div>
            <p className="text-xs text-green-300">Économies totales</p>
          </div>

          <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 border border-orange-500/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <Crown className="text-orange-400" size={24} />
              <div>
                <p className="text-sm text-orange-200">Réserve Réseau</p>
                <p className="text-2xl font-bold text-white">{stats.networkReserve.toFixed(2)} BNB</p>
              </div>
            </div>
            <p className="text-xs text-orange-300">Pool collectif</p>
          </div>
        </div>

        {/* Comment ça marche */}
        <div className="bg-card-bg border border-card-border rounded-lg p-8">
          <h2 className="text-2xl font-bold text-heading mb-6 text-center">Comment Fonctionne le Système Premium ?</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-400">1</span>
              </div>
              <h3 className="text-lg font-semibold text-heading mb-3">Abonnement</h3>
              <p className="text-text-secondary">
                Payez 5€ une fois pour 365 jours d'accès premium.
                Recevez immédiatement 0.1 BNB de réserve personnelle.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-400">2</span>
              </div>
              <h3 className="text-lg font-semibold text-heading mb-3">Réserve Active</h3>
              <p className="text-text-secondary">
                Votre réserve se recharge automatiquement via les transactions
                du réseau et les fluctuations du CVTC.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-400">3</span>
              </div>
              <h3 className="text-lg font-semibold text-heading mb-3">Économies Garanties</h3>
              <p className="text-text-secondary">
                Chaque transaction vous fait économiser 2 centimes :
                1 centime avant + 1 centime après le swap.
              </p>
            </div>
          </div>
        </div>

        {/* Exemple concret */}
        <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-heading mb-6 text-center">Exemple Concret d'Économie</h2>

          <div className="max-w-2xl mx-auto">
            <div className="bg-black/30 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-text-secondary">Paiement souhaité :</span>
                <span className="text-xl font-bold text-white">10 €</span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Montant original :</span>
                  <span className="text-white">10.00 €</span>
                </div>

                <div className="flex justify-between items-center text-green-400">
                  <span>Remise automatique (2 centimes) :</span>
                  <span className="font-semibold">-0.02 €</span>
                </div>

                <div className="border-t border-gray-600 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Montant final :</span>
                    <span className="text-xl font-bold text-green-400">9.98 €</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-text-secondary mb-4">
                Sur 100 paiements de 10€, vous économisez <span className="text-green-400 font-semibold">2€ garantis</span> !
              </p>
              <p className="text-sm text-text-secondary">
                Et plus le réseau grandit, plus les économies augmentent grâce à l'effet viral.
              </p>
            </div>
          </div>
        </div>

        {/* Avantages détaillés */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card-bg border border-card-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-heading mb-4 flex items-center gap-2">
              <Crown className="text-purple-400" size={20} />
              Avantages Premium
            </h3>
            <ul className="space-y-3 text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Réserve automatique rechargée en permanence</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Remises garanties sur chaque transaction</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Accès prioritaire aux nouvelles fonctionnalités</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Support technique dédié</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Statistiques détaillées de vos économies</span>
              </li>
            </ul>
          </div>

          <div className="bg-card-bg border border-card-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-heading mb-4 flex items-center gap-2">
              <TrendingUp className="text-blue-400" size={20} />
              Effet Réseau Viral
            </h3>
            <ul className="space-y-3 text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">📈</span>
                <span>Plus d'utilisateurs = plus de transactions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">📈</span>
                <span>Plus de transactions = réserve collective plus importante</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">📈</span>
                <span>Réserve collective = recharges automatiques plus fréquentes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">📈</span>
                <span>Recharges fréquentes = économies maximales</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">🚀</span>
                <span>Cercle vertueux d'économies croissantes</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Composant d'abonnement */}
        <PremiumSubscription />
      </div>
    </div>
  );
}