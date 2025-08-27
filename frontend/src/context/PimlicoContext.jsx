/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { http } from "viem";
import { createSmartAccountClient } from "permissionless";
import { bscTestnet } from "viem/chains";

const PimlicoContext = createContext(null);

export const PimlicoProvider = ({ children }) => {
  const { wallets } = useWallets();
  const [smartAccount, setSmartAccount] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      setError(null);
      if (!wallets || wallets.length === 0) {
        return;
      }

      const privyWallet = wallets[0];
      const account = await privyWallet.getEthereumProvider();
      const chain = bscTestnet;

      if (!account) {
        return;
      }

      try {
        const apiKey = import.meta.env.VITE_PIMLICO_API_KEY;
        const bundlerUrl = `https://api.pimlico.io/v1/bsc-testnet/rpc?apikey=${apiKey}`;

        const client = await createSmartAccountClient({
          account,
          chain,
          transport: http(bundlerUrl),
        });

        setSmartAccount(client);
        console.log("✅ Smart Account initialisé ! Adresse:", client.account.address);
      } catch (err) {
        console.error("❌ Erreur init Pimlico :", err);
        setError(err.message);
      }
    };

    init();
  }, [wallets]);

  return (
    <PimlicoContext.Provider value={{ smartAccount, error }}>
      {children}
    </PimlicoContext.Provider>
  );
};

export const usePimlico = () => useContext(PimlicoContext);