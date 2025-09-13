import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuroraBackground } from './components/ui/AuroraBackground';
import ProtectedRoute from './components/ProtectedRoute';

// Import de toutes les pages de l'application
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ManagementPage from './pages/ManagementPage';
import OnboardingPage from './pages/OnboardingPage';
import OnboardingDetailsPage from './pages/OnboardingDetailsPage';
import InformationPage from './pages/InformationPage';
import FonctionnalitesPage from './pages/FonctionnalitesPage';
import P2PTransferPage from './pages/P2PTransferPage';
import SettingsPage from './pages/SettingsPage'; // Importer la nouvelle page
import TestPimlicoTutorial from './pages/TestPimlicoTutorial'; // Ajout de la page de test

// Import des styles globaux (qui contiennent maintenant le design system)
import './index.css';

function App() {
  return (
    <>
      <AuroraBackground />
      <Routes>
        {/* Route de test isolée - PAS PROTÉGÉE */}
        <Route path="/test-pimlico" element={<TestPimlicoTutorial />} />

        {/* Routes publiques */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/information" element={<InformationPage />} />
        <Route path="/onboarding/:mode" element={<OnboardingPage />} />
        <Route path="/onboarding-details" element={<OnboardingDetailsPage />} />

        {/* Routes protégées nécessitant authentification */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/management" element={
          <ProtectedRoute>
            <ManagementPage />
          </ProtectedRoute>
        } />

        <Route path="/fonctionnalites" element={
          <ProtectedRoute>
            <FonctionnalitesPage />
          </ProtectedRoute>
        } />

        {/* Routes hautement sensibles nécessitant wallet */}
        <Route path="/p2p-transfer" element={
          <ProtectedRoute requireWallet={true}>
            <P2PTransferPage />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute requireWallet={true}>
            <SettingsPage />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

export default App;