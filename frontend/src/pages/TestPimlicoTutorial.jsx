import React, { useEffect, useState } from 'react';
import { http, createPublicClient } from "viem";
import { sepolia } from "viem/chains";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createSmartAccountClient } from "permissionless";
import { toSimpleSmartAccount } from "permissionless/accounts";

// Adresses standards pour l'EntryPoint v0.6 et la factory SimpleAccount
const ENTRYPOINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const SIMPLE_ACCOUNT_FACTORY_ADDRESS = "0x9406Cc6185a346906296840746125a0E44976454";

const TestPimlicoTutorial = () => {
  const [status, setStatus] = useState("Initialisation...");
  const [results, setResults] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const runTest = async () => {
      try {
        setStatus("Vérification de la clé API...");
        const apiKey = import.meta.env.VITE_PIMLICO_API_KEY;
        if (!apiKey) throw new Error("Clé VITE_PIMLICO_API_KEY manquante dans le .env");
        setResults(prev => ({ ...prev, apiKey: "✅ Trouvée" }));

        setStatus("Génération du signer (EOA) en mémoire...");
        const signer = privateKeyToAccount(generatePrivateKey());
        setResults(prev => ({ ...prev, signer: `✅ Créé (adresse: ${signer.address.substring(0, 10)}...)` }));

        setStatus("Création du Public Client (vers Sepolia)...");
        const publicClient = createPublicClient({
          transport: http("https://rpc.sepolia.org"),
        });
        setResults(prev => ({ ...prev, publicClient: "✅ Créé" }));

        setStatus("Création du Smart Account via toSimpleSmartAccount...");
        const smartAccount = await toSimpleSmartAccount(publicClient, {
            signer: signer,
            factoryAddress: SIMPLE_ACCOUNT_FACTORY_ADDRESS,
            entryPoint: ENTRYPOINT_ADDRESS,
        });
        setResults(prev => ({ ...prev, smartAccount: `✅ Créé (adresse: ${smartAccount.address})` }));
        
        setStatus("✅ Test 100% isolé terminé avec succès !");

      } catch (e) {
        console.error("Erreur durant le test du tutoriel Pimlico:", e);
        setError(e.message);
        setStatus("❌ Échec du test.");
      }
    };

    runTest();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', color: 'white', background: '#111', margin: '2rem', borderRadius: '8px' }}>
      <h1>Bac à Sable - Tutoriel Pimlico (100% Isolé)</h1>
      <p>Cette page réplique le tutoriel sans aucune dépendance à Privy ou au contexte de l'application.</p>
      <hr style={{ margin: '1rem 0', borderColor: '#444' }} />
      <h2 style={{ marginBottom: '1rem' }}>Statut : <span style={{ color: error ? 'red' : '#32CD32' }}>{status}</span></h2>
      {error && <p style={{ color: 'red' }}><strong>Erreur :</strong> {error}</p>}
      <div style={{ marginTop: '1rem' }}>
        <h3>Résultats :</h3>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          <li>Clé API Pimlico : {results.apiKey || "En attente..."}</li>
          <li>Signer (EOA) : {results.signer || "En attente..."}</li>
          <li>Client Public : {results.publicClient || "En attente..."}</li>
          <li>Smart Account : {results.smartAccount || "En attente..."}</li>
        </ul>
      </div>
    </div>
  );
};

export default TestPimlicoTutorial;
