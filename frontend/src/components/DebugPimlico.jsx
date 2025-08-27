import React from "react";
import { useWallets } from "@privy-io/react-auth";
import { usePimlico } from "../context/PimlicoContext";

export const DebugPimlico = () => {
  const { wallets } = useWallets();
  const { smartAccount } = usePimlico();

  return (
    <div style={{ padding: "1rem", border: "2px dashed #00f", margin: "1rem 0", borderRadius: "8px", color: "white" }}>
      <h3>Debug Pimlico</h3>
      <div>
        <strong>Privy Wallets:</strong>
        {wallets && wallets.length > 0 ? (
          <ul>
            {wallets.map((w, i) => (
              <li key={i}>{w.address || "Adresse non disponible"}</li>
            ))}
          </ul>
        ) : (
          <p>⚠️ Aucun wallet Privy détecté</p>
        )}
      </div>

      <div>
        <strong>Smart Account Pimlico:</strong>
        {smartAccount ? (
          <div>
            <p>Adresse: {smartAccount.address || "Adresse Smart Account non disponible"}</p>
            <p>Déployé: {smartAccount.isDeployed ? "Oui" : "Non"}</p>
          </div>
        ) : (
          <p>⏳ Smart Account non initialisé</p>
        )}
      </div>
    </div>
  );
};
