/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { createSmartAccountClient } from "permissionless";
import { toSafeSmartAccount } from "permissionless/accounts";
import { createPaymasterClient } from "viem/account-abstraction";
import { bscTestnet } from "viem/chains";

const ENTRYPOINT_V07_ADDRESS = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

const PimlicoContext = createContext(null);

export const PimlicoProvider = ({ children }) => {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [smartAccount, setSmartAccount] = useState(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState(null);
  const [error, setError] = useState(null);

  const initializeSmartAccount = async () => {
    setError(null);

    // Priorité : MetaMask d'abord, puis guest wallet Privy
    let selectedWallet = wallets.find((wallet) => wallet.walletClientType === 'metamask');

    if (!selectedWallet) {
      // Fallback vers guest wallet Privy
      selectedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
    }

    if (!selectedWallet) {
      setError("Aucun wallet détecté. Veuillez connecter MetaMask ou utiliser le guest wallet.");
      return;
    }

    console.log(`🔗 Wallet détecté: ${selectedWallet.walletClientType} - ${selectedWallet.address}`);

    try {
      // Vérifier et changer de réseau si nécessaire
      if (selectedWallet.chainId !== `eip155:${bscTestnet.id}`) {
          await selectedWallet.switchChain(bscTestnet.id);
      }

      const publicClient = createPublicClient({
        chain: bscTestnet,
        transport: http(),
      });

      const ethereumProvider = await selectedWallet.getEthereumProvider();
      if (!ethereumProvider) {
        setError("Impossible d'obtenir le provider Ethereum du wallet.");
        return;
      }

      const walletClient = createWalletClient({
        chain: bscTestnet,
        transport: custom(ethereumProvider),
      });

      const [walletAddress] = await walletClient.getAddresses();
      const walletType = selectedWallet.walletClientType === 'metamask' ? 'MetaMask' : 'Guest Wallet';
      console.log(`🔗 Wallet Address (${walletType}): ${walletAddress}`);

      // Créer un objet owner avec les propriétés minimales requises
      const ownerAccount = {
        address: walletAddress,
        signMessage: async ({ message }) => {
          return await walletClient.signMessage({ message, account: walletAddress });
        },
        signTypedData: async (typedData) => {
          return await walletClient.signTypedData({ ...typedData, account: walletAddress });
        },
        signTransaction: async (transaction) => {
          return await walletClient.signTransaction({ ...transaction, account: walletAddress });
        },
        type: 'local'
      };

      const safeAccount = await toSafeSmartAccount({
        client: publicClient,
        owners: [ownerAccount],
        entryPoint: { address: ENTRYPOINT_V07_ADDRESS, version: "0.7" },
        version: "1.4.1",
      });

      console.log(`🏦 Smart Account Address: ${safeAccount.address}`);

       const apiKey = import.meta.env.VITE_PIMLICO_API_KEY;
       // Utiliser Ethereum Sepolia au lieu de BSC Testnet pour les tests ERC-4337
       const bundlerUrl = `https://api.pimlico.io/v1/sepolia/rpc?apikey=${apiKey}`;
       const paymasterUrl = `https://api.pimlico.io/v1/sepolia/rpc?apikey=${apiKey}`;

       // Create paymaster client pour Sepolia
       const paymaster = createPaymasterClient({
         transport: http(paymasterUrl),
       });

       const smartAccountClient = createSmartAccountClient({
         account: safeAccount,
         chain: bscTestnet, // Garder BSC Testnet pour l'interface
         bundlerTransport: http(bundlerUrl), // Mais utiliser Sepolia bundler
         paymaster,
         userOperation: {
           estimateFeesPerGas: async ({ bundlerClient }) => {
             const gasPrice = await publicClient.getGasPrice();
             return {
               maxFeePerGas: gasPrice,
               maxPriorityFeePerGas: gasPrice / 10n,
             };
           },
         },
       });

      setSmartAccount(smartAccountClient);
      setSmartAccountAddress(safeAccount.address);
    } catch (err) {
      console.error("❌ Erreur init Pimlico :", err);
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!ready || !authenticated || !wallets || wallets.length === 0) {
      if (!authenticated && smartAccount) {
        setSmartAccount(null);
      }
      return;
    }

    if (!smartAccount) {
        initializeSmartAccount();
    }

  }, [ready, authenticated, wallets, smartAccount]);

  return (
    <PimlicoContext.Provider value={{ smartAccount, smartAccountAddress, error }}>
      {children}
    </PimlicoContext.Provider>
  );
};

export const usePimlico = () => useContext(PimlicoContext);