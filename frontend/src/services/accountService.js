
import { createPublicClient, http } from 'viem';
import { bscTestnet } from 'viem/chains';
import { createSmartAccountClient } from 'permissionless';
import { toSimpleSmartAccount } from 'permissionless/accounts';

// 1. Create a public client to interact with the blockchain
const publicClient = createPublicClient({
  transport: http("https://data-seed-prebsc-1-s1.binance.org:8545/"), // Public BSC Testnet RPC
  chain: bscTestnet,
});

// 2. Define the constant addresses for the ERC-4337 infrastructure
const entryPoint = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"; // EntryPoint v0.6
const factoryAddress = "0x9406Cc6185a346906296840746125a0E44976454"; // SimpleAccount Factory

// 3. Define the URL for our self-hosted bundler
// For testing, we will run it locally on port 4337.
const bundlerUrl = "http://localhost:4337/rpc";

/**
 * Creates a smart account and a client to interact with it.
 * @param {object} privySigner - The EOA signer object provided by Privy.
 * @returns {Promise<object>} An object containing the smart account and the smart account client.
 */
export const createSmartAccount = async (privySigner) => {
  if (!privySigner) {
    throw new Error("Privy signer not provided");
  }

  console.log("EOA Signer Address from Privy:", privySigner.address);

  // 4. Create the smart account object from the EOA signer
  const smartAccount = await toSimpleSmartAccount({
    publicClient,
    signer: privySigner,
    entryPoint: entryPoint,
    factoryAddress: factoryAddress,
  });

  console.log("Smart Account Address:", smartAccount.address);

  // 5. Create the SmartAccountClient to send UserOperations
  const smartAccountClient = createSmartAccountClient({
    account: smartAccount,
    chain: bscTestnet,
    transport: http(bundlerUrl),
    // We will add our self-hosted paymaster client here later
  });

  console.log("Smart Account Client created successfully!");

  return { smartAccount, smartAccountClient };
};
