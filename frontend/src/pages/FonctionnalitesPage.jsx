import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { FeatureCard, FeatureCardTitle } from '../components/ui/FeatureCard';

export default function FonctionnalitesPage() {
  return (
    <div className="p-8 text-text-primary">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary mb-8">
        <ArrowLeft size={18} />
        Retour au Dashboard
      </Link>
      
      <h1 className="text-2xl font-bold text-heading">Fonctionnalités</h1>
      <p className="mt-2 mb-8">
        Voici les actions disponibles pour interagir avec votre portefeuille et les contrats.
      </p>

      <div className="flex justify-center mt-16">
        <Link to="/p2p-transfer" className="block hover:scale-105 transition-transform">
          <FeatureCard className="text-center">
            <div className="p-4">
              <FeatureCardTitle>P 2 P</FeatureCardTitle>
              <p className="text-text-secondary mt-4 max-w-xs">
                Le "Pair-à-Pair" (P2P) vous permet d'échanger et d'interagir directement avec d'autres personnes, sans intermédiaire, de manière sécurisée et transparente.
              </p>
            </div>
          </FeatureCard>
        </Link>
      </div>

    </div>
  );
}