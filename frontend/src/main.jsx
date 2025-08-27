import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PrivyProvider } from '@privy-io/react-auth';
import { ThemeProvider } from './context/ThemeContext';
import { PimlicoProvider } from './context/PimlicoContext'; // Importation
import './index.css';
import App from './App.jsx';

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;

if (!privyAppId) {
  throw new Error("VITE_PRIVY_APP_ID n'est pas défini dans votre fichier .env. Veuillez créer /frontend/.env et y ajouter la clé.");
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ['email'],
        appearance: {
          theme: 'dark',
          accentColor: '#676FFF',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      <BrowserRouter>
        <ThemeProvider>
          <PimlicoProvider> {/* Ajout du Provider */}
            <App />
          </PimlicoProvider>
        </ThemeProvider>
      </BrowserRouter>
    </PrivyProvider>
  </StrictMode>,
);