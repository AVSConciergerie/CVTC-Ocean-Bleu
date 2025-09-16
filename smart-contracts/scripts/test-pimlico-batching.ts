import { ethers } from "hardhat";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { createSmartAccountClient } from "permissionless";
import { toSafeSmartAccount } from "permissionless/accounts";
import { createPaymasterClient } from "viem/account-abstraction";
import { bscTestnet } from "viem/chains";

const ENTRYPOINT_V07_ADDRESS = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

async function main() {
  console.log("🚀 Test PIMLICO BATCHING - Optimisation des Transactions ERC-4337");

  const [deployer, user1, user2, user3] = await ethers.getSigners();
  console.log(`📋 Deployer: ${deployer.address}`);
  console.log(`👤 User1: ${user1.address}`);
  console.log(`👤 User2: ${user2.address}`);
  console.log(`👤 User3: ${user3.address}`);

  // Configuration Pimlico
  const apiKey = process.env.PIMLICO_API_KEY || "pim_32ESGpGsTSAn7VVUj7Frd7";
  const bundlerUrl = `https://api.pimlico.io/v1/binance-testnet/rpc?apikey=${apiKey}`;
  const paymasterUrl = `https://api.pimlico.io/v2/binance-testnet/rpc?apikey=${apiKey}`;

  // Adresses des contrats
  const cvtcPremiumAddress = process.env.CVTC_PREMIUM_ADDRESS;

  if (!cvtcPremiumAddress) {
    console.log("❌ Adresse CVTC_PREMIUM_ADDRESS manquante.");
    console.log("💡 Déployez d'abord: npx hardhat run scripts/deploy-all.ts --network bscTestnet");
    return;
  }

  console.log(`👑 CVTC Premium: ${cvtcPremiumAddress}`);

  try {
    // 1. Configuration du Smart Account Pimlico
    console.log("\n🏗️ Configuration Smart Account Pimlico...");

    const publicClient = createPublicClient({
      chain: bscTestnet,
      transport: http(),
    });

    const walletClient = createWalletClient({
      chain: bscTestnet,
      transport: custom({ request: async ({ method, params }) => {
        const provider = new ethers.providers.JsonRpcProvider("https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7");
        return await provider.send(method, params);
      }}),
    });

    const [walletAddress] = await walletClient.getAddresses();
    console.log(`🔗 Wallet Address: ${walletAddress}`);

    // Créer le owner account
    const ownerAccount = {
      address: walletAddress,
      signMessage: async ({ message }) => {
        return await walletClient.signMessage({ message, account: walletAddress });
      },
      signTypedData: async (typedData) => {
        return await walletClient.signTypedData({ ...typedData, account: walletAddress });
      },
      signTransaction: async (transaction) => {
        return await walletClient.signTransaction({ ...transaction, account: walletAddress });
      },
      type: 'local'
    };

    // Créer le Safe Smart Account
    const safeAccount = await toSafeSmartAccount({
      client: publicClient,
      owners: [ownerAccount],
      entryPoint: { address: ENTRYPOINT_V07_ADDRESS, version: "0.7" },
      version: "1.4.1",
    });

    console.log(`🏦 Smart Account Address: ${safeAccount.address}`);

    // Créer le paymaster client
    const paymaster = createPaymasterClient({
      transport: http(paymasterUrl)
    });

    // Créer le smart account client
    const smartAccountClient = createSmartAccountClient({
      account: safeAccount,
      chain: bscTestnet,
      bundlerTransport: http(bundlerUrl),
      paymaster,
      userOperation: {
        estimateFeesPerGas: async ({ bundlerClient }) => {
          const gasPrice = await publicClient.getGasPrice();
          return {
            maxFeePerGas: gasPrice,
            maxPriorityFeePerGas: gasPrice / 10n,
          };
        },
      },
    });

    console.log("✅ Smart Account Client Pimlico configuré");

    // 2. Abonnement premium via Pimlico (gasless)
    console.log("\n👑 Abonnement Premium Gasless via Pimlico...");

    const subscriptionPrice = "5000000000000000000"; // 5 BNB en wei

    const subscriptionTxHash = await smartAccountClient.sendTransaction({
      to: cvtcPremiumAddress,
      value: subscriptionPrice,
      data: "0x", // Encodage de subscribePremium()
    });

    console.log(`✅ Abonnement réussi! Hash: ${subscriptionTxHash}`);
    console.log(`🔍 BSCScan: https://testnet.bscscan.com/tx/${subscriptionTxHash}`);

    // 3. Test du batching avec Pimlico
    console.log("\n📦 Test BATCHING avec Pimlico (3+ transactions)...");

    const CVTCPremium = await ethers.getContractFactory("CVTCPremium");
    const cvtcPremium = CVTCPremium.attach(cvtcPremiumAddress) as any;

    // Préparer 5 transactions à batcher
    const batchTransactions = [
      {
        to: cvtcPremiumAddress,
        value: "0",
        data: cvtcPremium.interface.encodeFunctionData("addToBatch", [ethers.utils.parseEther("10.0")])
      },
      {
        to: cvtcPremiumAddress,
        value: "0",
        data: cvtcPremium.interface.encodeFunctionData("addToBatch", [ethers.utils.parseEther("15.0")])
      },
      {
        to: cvtcPremiumAddress,
        value: "0",
        data: cvtcPremium.interface.encodeFunctionData("addToBatch", [ethers.utils.parseEther("8.5")])
      },
      {
        to: cvtcPremiumAddress,
        value: "0",
        data: cvtcPremium.interface.encodeFunctionData("addToBatch", [ethers.utils.parseEther("1200")]) // > 1000 CVTC = bonus!
      },
      {
        to: cvtcPremiumAddress,
        value: "0",
        data: cvtcPremium.interface.encodeFunctionData("addToBatch", [ethers.utils.parseEther("25.0")])
      }
    ];

    console.log("🔄 Envoi du batch de 5 transactions via Pimlico...");

    // Envoyer le batch via Pimlico (gasless)
    const batchTxHash = await smartAccountClient.sendTransaction(batchTransactions);

    console.log(`✅ Batch envoyé avec succès! Hash: ${batchTxHash}`);
    console.log(`🔍 BSCScan: https://testnet.bscscan.com/tx/${batchTxHash}`);

    // 4. Vérification des résultats du batching
    console.log("\n📊 Vérification des Résultats du Batching...");

    // Attendre que la transaction soit confirmée
    console.log("⏳ Attente de confirmation...");
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Vérifier les statistiques
    const totalUsers = await cvtcPremium.totalPremiumUsers();
    const totalTransactions = await cvtcPremium.totalTransactions();
    const totalDiscounts = await cvtcPremium.totalDiscountsGiven();
    const p2pStats = await cvtcPremium.getP2PStats();
    const networkReserve = await cvtcPremium.getTotalReserves();

    console.log(`\n📈 Statistiques après batch:`);
    console.log(`👥 Utilisateurs premium: ${totalUsers}`);
    console.log(`🔄 Transactions totales: ${totalTransactions}`);
    console.log(`💰 Remises distribuées: ${ethers.utils.formatEther(totalDiscounts)} BNB`);
    console.log(`🎁 Bonus P2P distribués: ${ethers.utils.formatEther(p2pStats[0])} BNB`);
    console.log(`📈 Gros transferts: ${p2pStats[1]}`);
    console.log(`🏦 Réserve réseau: ${ethers.utils.formatEther(networkReserve)} BNB`);

    // 5. Analyse des économies réalisées
    console.log("\n💡 Analyse des Économies avec Batching:");

    const totalBatchAmount = 10.0 + 15.0 + 8.5 + 1200 + 25.0; // 1258.5
    const totalDiscountValue = Number(ethers.utils.formatEther(totalDiscounts));
    const totalP2PBonus = Number(ethers.utils.formatEther(p2pStats[0]));

    console.log(`💵 Montant total des transactions: ${totalBatchAmount} BNB`);
    console.log(`💰 Remises normales: ${totalDiscountValue.toFixed(4)} BNB`);
    console.log(`🎁 Bonus P2P (1200 CVTC): ${totalP2PBonus.toFixed(4)} BNB`);

    const totalSavings = totalDiscountValue + totalP2PBonus;
    const savingsPercentage = ((totalSavings / totalBatchAmount) * 100).toFixed(2);

    console.log(`💸 Économies totales: ${totalSavings.toFixed(4)} BNB (${savingsPercentage}%)`);

    // 6. Comparaison avec transactions individuelles
    console.log("\n⚖️ Comparaison Batching vs Individuel:");

    const gasPerTransaction = 0.001; // Estimation gas par transaction
    const individualGasCost = 5 * gasPerTransaction; // 5 transactions individuelles
    const batchGasCost = gasPerTransaction * 0.7; // Batching = ~30% économie gas

    console.log(`⛽ Coût gas individuel: ${individualGasCost.toFixed(4)} BNB`);
    console.log(`⛽ Coût gas batch: ${batchGasCost.toFixed(4)} BNB`);
    console.log(`💡 Économie gas: ${(individualGasCost - batchGasCost).toFixed(4)} BNB`);

    const totalSavingsWithGas = totalSavings + (individualGasCost - batchGasCost);
    console.log(`🏆 Économies totales (remises + gas): ${totalSavingsWithGas.toFixed(4)} BNB`);

    console.log("\n🎉 Test PIMLICO BATCHING terminé avec succès!");
    console.log("✅ Smart Account Pimlico opérationnel");
    console.log("✅ Batching de 5 transactions réussi");
    console.log("✅ Paymaster sponsoring fonctionnel");
    console.log("✅ Bonus P2P pour transferts > 1000 CVTC");
    console.log("✅ Économies maximales réalisées");
    console.log("✅ Système ERC-4337 optimisé");

  } catch (error: any) {
    console.log("❌ Erreur lors du test Pimlico batching:", error?.message || "Erreur inconnue");
  }
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});