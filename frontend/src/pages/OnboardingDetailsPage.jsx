import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, DollarSign, Shield, Zap, Users } from 'lucide-react';

export default function OnboardingDetailsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:text-blue-300 transition-colors"
          >
            <ArrowLeft size={20} />
            Retour à l'accueil
          </button>
          <h1 className="text-3xl font-bold text-white">Programme d'Onboarding CVTC</h1>
        </div>

        {/* Hero Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Bienvenue dans l'ère du Web3 !
            </h2>
            <p className="text-xl text-blue-200 mb-6">
              Découvrez comment Ocean Bleu révolutionne l'intégration à l'écosystème blockchain
            </p>
            <div className="flex justify-center gap-4 text-sm text-blue-300">
              <span className="flex items-center gap-2">
                <Clock size={16} />
                30 jours d'accompagnement
              </span>
              <span className="flex items-center gap-2">
                <Zap size={16} />
                Transactions sans frais
              </span>
              <span className="flex items-center gap-2">
                <Shield size={16} />
                Sécurité maximale
              </span>
            </div>
          </div>
        </div>

        {/* Processus Détaillé */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

          {/* Étape 1 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">1</span>
              </div>
              <h3 className="text-xl font-bold text-white">Acceptation des Conditions</h3>
            </div>
            <p className="text-blue-200 mb-4">
              Vous acceptez les conditions générales qui détaillent le programme d'onboarding automatique.
            </p>
            <ul className="text-sm text-blue-300 space-y-2">
              <li>• Transparence totale sur le mécanisme</li>
              <li>• Engagement de 30 jours d'accompagnement</li>
              <li>• Autorisation pour les opérations automatisées</li>
            </ul>
          </div>

          {/* Étape 2 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">2</span>
              </div>
              <h3 className="text-xl font-bold text-white">Création du Smart Account</h3>
            </div>
            <p className="text-blue-200 mb-4">
              Un smart account ERC-4337 est automatiquement créé pour vous via Pimlico.
            </p>
            <ul className="text-sm text-blue-300 space-y-2">
              <li>• Compatible avec tous les wallets</li>
              <li>• Transactions sans frais réseau</li>
              <li>• Sécurité renforcée par les smart contracts</li>
            </ul>
          </div>

          {/* Étape 3 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">3</span>
              </div>
              <h3 className="text-xl font-bold text-white">Programme de 30 Jours</h3>
            </div>
            <p className="text-blue-200 mb-4">
              Durant 30 jours, des swaps automatiques quotidiens sont exécutés.
            </p>
            <ul className="text-sm text-blue-300 space-y-2">
              <li>• 0.0002 BNB → CVTC chaque jour</li>
              <li>• Accumulation progressive de CVTC</li>
              <li>• Système entièrement automatisé</li>
            </ul>
          </div>

          {/* Étape 4 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">4</span>
              </div>
              <h3 className="text-xl font-bold text-white">Remboursement Progressif</h3>
            </div>
            <p className="text-blue-200 mb-4">
              Selon l'accumulation de CVTC, des remboursements sont automatiquement effectués.
            </p>
            <ul className="text-sm text-blue-300 space-y-2">
              <li>• Palier 1 : 10% après 0.30€ CVTC</li>
              <li>• Palier 2 : 30% après 0.05€ CVTC</li>
              <li>• Palier 3 : 60% après 0.5% de 0.35€</li>
            </ul>
          </div>
        </div>

        {/* Avantages */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 mb-8 border border-white/20">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Avantages du Programme</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <DollarSign className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Économique</h4>
              <p className="text-blue-200 text-sm">
                Toutes les transactions sont sans frais grâce au système gasless
              </p>
            </div>
            <div className="text-center">
              <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Sécurisé</h4>
              <p className="text-blue-200 text-sm">
                Smart contracts audités et architecture ERC-4337 éprouvée
              </p>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">Social</h4>
              <p className="text-blue-200 text-sm">
                Système circulaire qui bénéficie à toute la communauté
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Commencer l'Onboarding
          </button>
          <p className="text-blue-300 mt-4 text-sm">
            En cliquant, vous serez redirigé vers le processus d'acceptation des conditions
          </p>
        </div>
      </div>
    </div>
  );
}