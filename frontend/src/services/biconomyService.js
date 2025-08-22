import { createSmartAccountClient } from "@biconomy/account";
// Récupérer les URLs depuis les variables d'environnement
const BUNDLER_URL = import.meta.env.VITE_BICONOMY_BUNDLER_URL;
const PAYMASTER_URL = import.meta.env.VITE_BICONOMY_PAYMASTER_URL;

/**
 * Initialise et configure le client de compte intelligent Biconomy.
 * @param {object} signer - Le `signer` du portefeuille, qui est le `walletClient` de Privy.
 * @returns {Promise<object>} Le client de compte intelligent configuré.
 */
export const createBiconomySmartAccount = async (signer) => {
  if (!signer) {
    throw new Error("Le signer (walletClient) est requis.");
  }

  // Le signer (walletClient de Privy) est déjà un client Viem configuré.
  // Nous pouvons le passer directement à Biconomy.

  // Créer le client de compte intelligent Biconomy
  const smartAccount = await createSmartAccountClient({
    signer,
    bundlerUrl: BUNDLER_URL,
    biconomyPaymasterApiKey: PAYMASTER_URL,
  });

  const saAddress = await smartAccount.getAccountAddress();
  console.log("Compte intelligent Biconomy créé avec succès. Adresse SA:", saAddress);

  return smartAccount;
};

/**
 * Envoie une transaction de test via le compte intelligent Biconomy.
 * @param {object} smartAccount - Le client de compte intelligent Biconomy.
 * @param {string} recipientAddress - L'adresse du destinataire.
 * @param {string} amount - Le montant à envoyer (en tant que chaîne de caractères).
 * @returns {Promise<object>} Le résultat de la transaction.
 */
export const sendTestTransaction = async (smartAccount, recipientAddress, amount) => {
  const tx = {
    to: recipientAddress,
    value: amount, // Le montant doit être en wei
    // data: "0x...", // Pour les interactions avec des contrats
  };

  // Envoyer la transaction via le Paymaster de Biconomy
  const userOpResponse = await smartAccount.sendTransaction(tx, {
    paymasterServiceData: {
      mode: "SPONSORED", // Sponsoriser les frais de gaz
    },
  });

  console.log("Réponse de l'UserOp :", userOpResponse);
  return userOpResponse;
};
