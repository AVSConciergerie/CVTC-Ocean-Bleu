import 'dotenv/config';
import { ethers } from 'ethers';
import { createSmartAccountClient } from '@biconomy/account';

async function main() {
  console.log("Lancement du script de test Biconomy...");

  // --- 1. Chargement de la configuration depuis .env ---
  const privateKey = process.env.TEST_PRIVATE_KEY;
  const bundlerUrl = process.env.BICONOMY_BUNDLER_URL;
  const paymasterUrl = process.env.BICONOMY_PAYMASTER_URL;

  if (!privateKey || !bundlerUrl || !paymasterUrl) {
    console.error("Erreur : Assurez-vous que TEST_PRIVATE_KEY, BICONOMY_BUNDLER_URL, et BICONOMY_PAYMASTER_URL sont définis dans le fichier .env du backend.");
    return;
  }
  console.log("Configuration chargée.");

  // --- 2. Initialisation du portefeuille (Signer) ---
  const provider = new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545/'); // BSC Testnet RPC
  const signer = new ethers.Wallet(privateKey, provider);
  console.log(`Portefeuille initialisé pour l'adresse : ${signer.address}`);

  // --- 3. Création du Smart Account Biconomy ---
  console.log("Création du Smart Account Biconomy...");
  const smartAccount = await createSmartAccountClient({
    signer,
    bundlerUrl,
    biconomyPaymasterApiKey: paymasterUrl,
  });
  const saAddress = await smartAccount.getAccountAddress();
  console.log(`Smart Account créé avec succès ! Adresse : ${saAddress}`);

  // --- 4. Envoi d'une transaction de test sponsorisée ---
  console.log("\nPréparation de la transaction de test...");
  // Nous utilisons l'adresse du portefeuille de l'utilisateur comme destinataire pour le test.
  const recipientAddress = signer.address;
  const tx = {
    to: recipientAddress,
    value: '0', // 0 BNB, juste pour tester le sponsoring
    data: '0x',
  };

  console.log(`Envoi d'une transaction de 0 BNB de ${saAddress} vers ${recipientAddress}...`);

  try {
    const userOpResponse = await smartAccount.sendTransaction(tx, {
      paymasterServiceData: { mode: 'SPONSORED' },
    });

    console.log("UserOperation envoyée ! En attente de la confirmation de la transaction...");
    const { transactionHash } = await userOpResponse.waitForTxHash();

    console.log("\n--- SUCCÈS ---");
    console.log(`Transaction confirmée ! Hash : ${transactionHash}`);
    console.log(`Voir sur BscScan (Testnet) : https://testnet.bscscan.com/tx/${transactionHash}`);
    console.log("Le Paymaster a bien sponsorisé la transaction.");

  } catch (error) {
    console.error("\n--- ERREUR ---");
    console.error("La transaction a échoué :");
    console.error(error);
  }
}

main();