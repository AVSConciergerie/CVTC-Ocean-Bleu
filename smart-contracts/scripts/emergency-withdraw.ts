import { ethers } from "hardhat";

async function main() {
  console.log("🚨 RETRAIT D'URGENCE DES TOKENS");
  console.log("===============================");

  const OLD_SWAP_ADDRESS = "0x9fD15619a90005468F02920Bb569c95759Da710C";
  const CVTC_TOKEN_ADDRESS = "0x532FC49071656C16311F2f89E6e41C53243355D3";

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  const swapContract = await ethers.getContractAt("CVTCSwap", OLD_SWAP_ADDRESS);
  const cvtcToken = await ethers.getContractAt("CVTCLPToken", CVTC_TOKEN_ADDRESS);

  // Vérifier l'état actuel
  console.log("\\n📊 ÉTAT ACTUEL:");
  const contractCvtcBalance = await cvtcToken.balanceOf(OLD_SWAP_ADDRESS);
  const contractBnbBalance = await ethers.provider.getBalance(OLD_SWAP_ADDRESS);
  const [bnbReserve, cvtcReserve] = await swapContract.getReserves();

  console.log(`🏦 CVTC dans contrat: ${ethers.formatUnits(contractCvtcBalance, 2)}`);
  console.log(`💰 BNB dans contrat: ${ethers.formatEther(contractBnbBalance)}`);
  console.log(`💰 BNB réserve: ${ethers.formatEther(bnbReserve)}`);
  console.log(`🪙 CVTC réserve: ${ethers.formatUnits(cvtcReserve, 2)}`);

  // Calcul du ratio actuel
  if (bnbReserve > 0n) {
    const currentRatio = Number(ethers.formatUnits(contractCvtcBalance, 2)) / Number(ethers.formatEther(bnbReserve));
    console.log(`📈 Ratio actuel: 1 BNB = ${currentRatio.toLocaleString()} CVTC`);
  }

  // Méthode 1: Essayer d'ajouter une fonction de retrait au contrat existant
  console.log("\\n🔧 MÉTHODE 1: Fonction de retrait d'urgence...");

  // Pour cela, il faudrait modifier le contrat déployé, ce qui n'est pas possible
  // Alternative: Créer un script qui simule le retrait en utilisant les fonctions existantes

  console.log("💡 Le contrat déployé ne peut pas être modifié");
  console.log("🔄 Création d'un système de contournement...");

  // Méthode 2: Créer un nouveau système simple
  console.log("\\n🏗️ MÉTHODE 2: Nouveau système simplifié...");

  const SimpleSwap = await ethers.getContractFactory("CVTCSwapEmergency");
  const simpleSwap = await SimpleSwap.deploy(CVTC_TOKEN_ADDRESS);
  await simpleSwap.waitForDeployment();

  const simpleSwapAddress = await simpleSwap.getAddress();
  console.log(`✅ Nouveau contrat simple: ${simpleSwapAddress}`);

  // Transférer les BNB de l'ancien contrat vers le nouveau
  console.log("\\n💰 Transfert des BNB...");
  if (contractBnbBalance > 0n) {
    try {
      // Cette partie nécessite que l'ancien contrat ait une fonction de retrait BNB
      console.log("⚠️ L'ancien contrat n'a pas de fonction de retrait BNB");
      console.log("💡 Il faudrait ajouter une fonction withdrawBNB() à l'ancien contrat");

      // Alternative: Mint des tokens dans le nouveau contrat
      console.log("\\n🪙 Alternative: Mint de tokens dans le nouveau contrat...");
      const mintAmount = ethers.parseUnits("2500000000", 2);

      try {
        const mintTx = await cvtcToken.mint(simpleSwapAddress, mintAmount);
        await mintTx.wait();
        console.log(`✅ ${ethers.formatUnits(mintAmount, 2)} CVTC mintés dans le nouveau contrat`);
      } catch (mintError) {
        console.log("❌ Mint impossible:", mintError.message);

        // Solution finale: Créer un token wrapper ou utiliser une approche différente
        console.log("\\n🎯 SOLUTION FINALE:");
        console.log("===================");
        console.log("Puisque les contrats existants ont des limitations, voici la solution:");

        console.log("\\n1️⃣ CRÉER UN NOUVEAU TOKEN CVTC:");
        console.log("   - Déployer CVTCLPToken.sol avec permissions simplifiées");
        console.log("   - Mint 2.5 milliards de CVTC dans le nouveau contrat swap");
        console.log("   - Ajouter 0.00002 BNB pour le ratio anti-baleine");

        console.log("\\n2️⃣ ADRESSE SUGGÉRÉE:");
        console.log(`   Ancien: ${OLD_SWAP_ADDRESS}`);
        console.log(`   Nouveau: ${simpleSwapAddress} (déjà déployé)`);

        console.log("\\n3️⃣ ACTIONS REQUISES:");
        console.log("   - Mint tokens dans le nouveau contrat");
        console.log("   - Ajouter 0.00002 BNB");
        console.log("   - Initialiser les réserves");
        console.log("   - Mettre à jour le backend");

        // Montrer l'état du nouveau contrat
        const [newBnb, newCvtc] = await simpleSwap.getReserves();
        console.log(`\\n📊 ÉTAT NOUVEAU CONTRAT:`);
        console.log(`💰 BNB: ${ethers.formatEther(newBnb)}`);
        console.log(`🪙 CVTC: ${ethers.formatUnits(newCvtc, 2)}`);
        console.log(`📍 Adresse: ${simpleSwapAddress}`);
      }

    } catch (error) {
      console.log("❌ Erreur lors du transfert:", error.message);
    }
  }

  console.log("\\n🎯 RÉSUMÉ:");
  console.log("==========");
  console.log("✅ Nouveau contrat prêt");
  console.log("⚠️ Tokens pas encore migrés");
  console.log("💡 Solution: Mint dans le nouveau contrat");
  console.log("🚀 Prêt pour la phase finale!");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});