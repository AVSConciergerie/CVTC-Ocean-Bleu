import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuroraBackground } from './components/ui/AuroraBackground';

// Import de toutes les pages de l'application
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ManagementPage from './pages/ManagementPage';
import OnboardingPage from './pages/OnboardingPage';
import InformationPage from './pages/InformationPage';
import FonctionnalitesPage from './pages/FonctionnalitesPage';
import P2PTransferPage from './pages/P2PTransferPage';
import TestPimlicoTutorial from './pages/TestPimlicoTutorial'; // Ajout de la page de test

// Import des styles globaux (qui contiennent maintenant le design system)
import './index.css';

function App() {
  return (
    <>
      <AuroraBackground />
      <Routes>
        {/* Route de test isolée */}
        <Route path="/test-pimlico" element={<TestPimlicoTutorial />} />

        {/* Routes existantes de l'application */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/management" element={<ManagementPage />} />
        <Route path="/onboarding/:mode" element={<OnboardingPage />} />
        <Route path="/information" element={<InformationPage />} />
        <Route path="/fonctionnalites" element={<FonctionnalitesPage />} />
        <Route path="/p2p-transfer" element={<P2PTransferPage />} />
      </Routes>
    </>
  );
}

export default App;