import React from "react";
import { usePimlico } from "../context/PimlicoContext";

export const SmartAccountDisplay = () => {
  const { smartAccount, error } = usePimlico();

  if (error) {
    return <div style={{ color: "red" }}>Erreur : {error}</div>;
  }

  if (!smartAccount) {
    return <div>Connexion en cours… ⚡</div>;
  }

  return (
    <div>
      <h2>Smart Account Pimlico</h2>
      <p>
        Adresse : <code>{smartAccount.account.address}</code>
      </p>
    </div>
  );
};
