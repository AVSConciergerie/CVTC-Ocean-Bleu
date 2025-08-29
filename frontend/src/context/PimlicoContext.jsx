/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { createSmartAccountClient } from "permissionless";
import { toSafeSmartAccount } from "permissionless/accounts";
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

    const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
    if (!embeddedWallet) {
      return;
    }

    try {
      if (embeddedWallet.chainId !== `eip155:${bscTestnet.id}`) {
          await embeddedWallet.switchChain(bscTestnet.id);
      }
      
      // Créer un client public
      const publicClient = createPublicClient({
        chain: bscTestnet,
        transport: http(),
      });

      // Obtenir le provider Ethereum de Privy
      const ethereumProvider = await embeddedWallet.getEthereumProvider();
      if (!ethereumProvider) return;

      // Créer un wallet client à partir du provider Privy
      const walletClient = createWalletClient({
        chain: bscTestnet,
        transport: custom(ethereumProvider),
      });

      // Obtenir l'adresse du wallet
      const [walletAddress] = await walletClient.getAddresses();
      console.log(`🔗 Wallet Address (Guest): ${walletAddress}`);

      // Créer le Smart Account à partir du wallet client
      const safeAccount = await toSafeSmartAccount({
        client: publicClient,
        owners: [{ address: walletAddress }], // Utiliser l'adresse du wallet comme owner
        entryPoint: { address: ENTRYPOINT_V07_ADDRESS, version: "0.7" },
        version: "1.4.1",
      });

      console.log(`🏦 Smart Account Address: ${safeAccount.address}`);

      const apiKey = import.meta.env.VITE_PIMLICO_API_KEY;
      const bundlerUrl = `https://api.pimlico.io/v1/binance-testnet/rpc?apikey=${apiKey}`;

      const smartAccountClient = await createSmartAccountClient({
        account: safeAccount,
        chain: bscTestnet,
        bundlerTransport: http(bundlerUrl),
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
