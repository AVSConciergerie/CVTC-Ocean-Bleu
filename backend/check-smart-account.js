import { toSafeSmartAccount } from "permissionless/accounts";
import { createPublicClient, http } from "viem";
import { bscTestnet } from "viem/chains";

const ENTRYPOINT_V07_ADDRESS = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

async function checkSmartAccount() {
  const ownerAddress = "0xCf248745d4c1e798110D14d5d81c31aaA63f4DD0";

  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http("https://data-seed-prebsc-1-s1.binance.org:8545/"),
  });

  // Créer un mock owner
  const ownerAccount = {
    address: ownerAddress,
    type: 'local'
  };

  const safeAccount = await toSafeSmartAccount({
    client: publicClient,
    owners: [ownerAccount],
    entryPoint: { address: ENTRYPOINT_V07_ADDRESS, version: "0.7" },
    version: "1.4.1",
  });

  console.log(`Adresse du wallet: ${ownerAddress}`);
  console.log(`Adresse du Smart Account attendue: ${safeAccount.address}`);
}

checkSmartAccount();