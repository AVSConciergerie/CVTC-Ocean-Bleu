import 'dotenv/config';
import { toSafeSmartAccount } from "permissionless/accounts";
import { createPublicClient, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { createSmartAccountClient } from "permissionless";

const ENTRYPOINT_V07_ADDRESS = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

async function runBscTest() {
  console.log("--- Lancement du Script de Test sur BSC Testnet ---");
  try {
    // 1. Clé API
    console.log("1. Vérification de la clé API...");
    const apiKey = process.env.VITE_PIMLICO_API_KEY;
    if (!apiKey) throw new Error("Clé VITE_PIMLICO_API_KEY manquante dans le .env");
    console.log("   => Clé API trouvée.");

    // 2. Clé privée
    console.log("\n2. Gestion de la clé privée...");
    const privateKey = process.env.PRIVATE_KEY ?? generatePrivateKey();
    console.log(`   => Clé privée de test (en mémoire) : ${privateKey.substring(0, 10)}...`);

    // 3. Création du Public Client
    console.log("\n3. Création du Public Client (vers BSC Testnet)...");
    const publicClient = createPublicClient({
      chain: bscTestnet,
      transport: http("https://data-seed-prebsc-1-s1.binance.org:8545/"),
    });
    console.log("   => Public Client créé.");

    // 4. Création du Pimlico Client (Paymaster)
    console.log("\n4. Création du Pimlico Client (Paymaster)...");
    const pimlicoUrl = `https://api.pimlico.io/v2/binance-testnet/rpc?apikey=${apiKey}`;
    const pimlicoClient = createPimlicoClient({
      transport: http(pimlicoUrl),
      entryPoint: {
        address: ENTRYPOINT_V07_ADDRESS,
        version: "0.7",
      },
    });
    console.log("   => Pimlico Client créé.");

    // 5. Création de l'instance Safe Smart Account
    console.log("\n5. Création de l'instance Safe Smart Account...");
    const account = await toSafeSmartAccount({
        client: publicClient,
        owners: [privateKeyToAccount(privateKey)],
        entryPoint: {
            address: ENTRYPOINT_V07_ADDRESS,
            version: "0.7",
        },
        version: "1.4.1",
    });
    console.log(`   => Compte Safe créé. Adresse: ${account.address}`);

    // 6. Création du Smart Account Client (pour transiger)
    console.log("\n6. Création du Smart Account Client...");
    const smartAccountClient = createSmartAccountClient({
        account,
        chain: bscTestnet,
        bundlerTransport: http(`https://api.pimlico.io/v1/binance-testnet/rpc?apikey=${apiKey}`),
        paymaster: pimlicoClient,
        userOperation: {
            estimateFeesPerGas: async () => (await pimlicoClient.getUserOperationGasPrice()).fast,
        },
    });
    console.log("   => Smart Account Client créé.");

    // 7. Envoi d'une transaction de test
    console.log("\n7. Envoi d'une transaction de test...");
    const txHash = await smartAccountClient.sendTransaction({
        to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        value: 0n,
        data: "0x1234",
    });
    console.log(`   => Transaction envoyée ! Hash: ${txHash}`);

    console.log("\n--- ✅ Test BSC Testnet terminé avec succès ! ---");
    console.log(`Lien BscScan pour la transaction : https://testnet.bscscan.com/tx/${txHash}`);

  } catch (error) {
    console.error("\n--- ❌ ÉCHEC DU TEST ---");
    console.error(error);
  }
}

runBscTest();