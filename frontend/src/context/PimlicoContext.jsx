/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { http } from "viem";
import { createSmartAccountClient } from "permissionless";
import { bscTestnet } from "viem/chains";

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
      
      const account = await embeddedWallet.getEthereumProvider();
      if (!account) return;

      const apiKey = import.meta.env.VITE_PIMLICO_API_KEY;
      const bundlerUrl = `https://api.pimlico.io/v1/binance-testnet/rpc?apikey=${apiKey}`;

      const client = await createSmartAccountClient({
        account,
        chain: bscTestnet,
        bundlerTransport: http(bundlerUrl),
      });

      setSmartAccount(client);
      setSmartAccountAddress(client.account.address);
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
