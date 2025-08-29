import 'dotenv/config';
import { writeFileSync } from "fs";
import { toSafeSmartAccount } from "permissionless/accounts";
import { createPublicClient, getContract, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { createBundlerClient } from "permissionless/clients";
import { createSmartAccountClient } from "permissionless";

const ENTRYPOINT_V07_ADDRESS = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

async function runFullTest() {
    console.log("--- Lancement du Test Complet Pimlico (Backend) ---");
    try {
        const apiKey = process.env.VITE_PIMLICO_API_KEY;
        if (!apiKey) throw new Error("Clé VITE_PIMLICO_API_KEY manquante dans le .env");

        const privateKey = process.env.PRIVATE_KEY ?? generatePrivateKey();
        console.log("1. Utilisation de la clé privée (en mémoire)");

        const publicClient = createPublicClient({
            chain: sepolia,
            transport: http("https://rpc.ankr.com/eth_sepolia"),
        });

        const account = await toSafeSmartAccount({
            client: publicClient,
            owners: [privateKeyToAccount(privateKey)],
            entryPoint: { address: ENTRYPOINT_V07_ADDRESS, version: "0.7" },
            version: "1.4.1",
        });
        console.log(`2. Smart account address: https://sepolia.etherscan.io/address/${account.address}`);

        const pimlicoUrl = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${apiKey}`;
        const pimlicoClient = createPimlicoClient({
            transport: http(pimlicoUrl),
            entryPoint: { address: ENTRYPOINT_V07_ADDRESS, version: "0.7" }
        });
        console.log("3. Clients Public et Pimlico créés.");

        console.log("\n--- Test avec smartAccountClient ---");
        const smartAccountClient = createSmartAccountClient({
            account,
            chain: sepolia,
            bundlerTransport: http(`https://api.pimlico.io/v1/sepolia/rpc?apikey=${apiKey}`),
            paymaster: pimlicoClient,
            userOperation: {
                estimateFeesPerGas: async () => (await pimlicoClient.getUserOperationGasPrice()).fast,
            }
        });

        const txHash = await smartAccountClient.sendTransaction({
            to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
            value: 0n,
            data: "0x1234",
        });
        console.log(`4. User operation (simple) incluse: https://sepolia.etherscan.io/tx/${txHash}`);

        const contract = getContract({
            address: "0x6D7A849791a8E869892f11E01c2A5f3b25a497B6",
            abi: [{"inputs":[],"name":"getLastGreeter","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"greet","outputs":[],"stateMutability":"nonpayable","type":"function"}],
            client: { public: publicClient, wallet: smartAccountClient }
        });

        const txHash2 = await contract.write.greet();
        console.log(`5. User operation (contract call) incluse: https://sepolia.etherscan.io/tx/${txHash2}`);

        console.log("\n--- ✅ Test Complet Terminé ---");

    } catch (error) {
        console.error("\n--- ❌ ÉCHEC DU TEST COMPLET ---");
        console.error(error);
    }
}

runFullTest();