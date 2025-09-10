import React, { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Wallet, User, AlertCircle, CheckCircle } from 'lucide-react';

export default function WalletSelector() {
  const { user, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleMetaMaskLogin = async () => {
    setIsConnecting(true);
    try {
      await login({
        loginMethods: ['wallet'],
        walletList: ['metamask']
      });
    } catch (error) {
      console.error('Erreur connexion MetaMask:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsConnecting(true);
    try {
      await login({
        loginMethods: ['wallet'],
        walletList: ['detected_wallets']
      });
    } catch (error) {
      console.error('Erreur connexion guest:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const getWalletStatus = () => {
    if (!authenticated) return null;

    const metamaskWallet = wallets.find(w => w.walletClientType === 'metamask');
    const privyWallet = wallets.find(w => w.walletClientType === 'privy');

    return {
      metamask: metamaskWallet,
      privy: privyWallet
    };
  };

  const walletStatus = getWalletStatus();

  if (!authenticated) {
    return (
      <div className="bg-card-bg border border-card-border rounded-lg p-6">
        <div className="text-center mb-6">
          <Wallet className="w-12 h-12 text-accent mx-auto mb-4" />
          <h3 className="text-xl font-bold text-heading mb-2">Connexion Wallet</h3>
          <p className="text-text-secondary">
            Choisissez votre méthode de connexion préférée
          </p>
        </div>

        <div className="space-y-4">
          {/* MetaMask */}
          <button
            onClick={handleMetaMaskLogin}
            disabled={isConnecting}
            className="w-full p-4 bg-orange-600/20 border border-orange-500/50 rounded-lg hover:bg-orange-600/30 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div className="text-left">
                <div className="font-semibold text-heading">MetaMask</div>
                <div className="text-sm text-text-secondary">Votre wallet personnel</div>
              </div>
              {isConnecting && (
                <div className="ml-auto animate-spin rounded-full h-5 w-5 border-b-2 border-orange-400"></div>
              )}
            </div>
          </button>

          {/* Guest Wallet */}
          <button
            onClick={handleGuestLogin}
            disabled={isConnecting}
            className="w-full p-4 bg-blue-600/20 border border-blue-500/50 rounded-lg hover:bg-blue-600/30 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-heading">Guest Wallet</div>
                <div className="text-sm text-text-secondary">Wallet temporaire</div>
              </div>
              {isConnecting && (
                <div className="ml-auto animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
              )}
            </div>
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-yellow-300 font-medium mb-1">Sécurité renforcée</p>
              <p className="text-yellow-200">
                Toutes les connexions sont sécurisées et vos fonds restent sous votre contrôle.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-bg border border-card-border rounded-lg p-6">
      <div className="text-center mb-6">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-heading mb-2">Wallet Connecté</h3>
        <p className="text-text-secondary">
          Vous êtes connecté et prêt à utiliser l'application
        </p>
      </div>

      <div className="space-y-4">
        {/* MetaMask Status */}
        {walletStatus?.metamask && (
          <div className="p-4 bg-green-900/20 border border-green-500/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-heading">MetaMask</div>
                <div className="text-sm text-green-300">Connecté et actif</div>
                <div className="text-xs text-green-400 font-mono mt-1">
                  {walletStatus.metamask.address.slice(0, 6)}...{walletStatus.metamask.address.slice(-4)}
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
          </div>
        )}

        {/* Guest Wallet Status */}
        {walletStatus?.privy && (
          <div className="p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-heading">Guest Wallet</div>
                <div className="text-sm text-blue-300">Connecté et actif</div>
                <div className="text-xs text-blue-400 font-mono mt-1">
                  {walletStatus.privy.address.slice(0, 6)}...{walletStatus.privy.address.slice(-4)}
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-card-border">
        <button
          onClick={logout}
          className="w-full button button-secondary"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}