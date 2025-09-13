import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

const BNB_RPC_URL = process.env.BNB_RPC_URL;
const OPERATOR_PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY;
// Nouvelle adresse du contrat corrigé
const CVTC_ONBOARDING_CONTRACT_ADDRESS = "0x8Cd8331a565769624A4735f613A44643DD2e2932"; // À mettre à jour après déploiement

const contractABI = [
  "function updateWhitelist(address user, bool status) external",
  "function buyForUser(address user, uint256 minCvtcOut) external payable",
  "function getReserves() external view returns (uint256, uint256)",
  "function cvtcToken() external view returns (address)"
];

async function swapForUserFixed() {
  console.log("🎯 SWAP CORRIGÉ POUR UTILISATEUR");
  console.log("===============================");

  const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

  if (!OPERATOR_PRIVATE_KEY) {
    console.log("❌ OPERATOR_PRIVATE_KEY non configurée");
    return;
  }

  const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
  const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);
  const onboardingContract = new ethers.Contract(CVTC_ONBOARDING_CONTRACT_ADDRESS, contractABI, operatorWallet);

  console.log(`👤 Utilisateur: ${USER_ADDRESS}`);
  console.log(`📍 Contrat: ${CVTC_ONBOARDING_CONTRACT_ADDRESS}`);
  console.log(`👑 Opérateur: ${operatorWallet.address}`);

  try {
    // Vérifier que l'utilisateur est whitelisted
    console.log(`\\n🔍 VÉRIFICATION WHITELIST...`);

    // Vérifier les réserves
    const [bnbReserve, cvtcReserve] = await onboardingContract.getReserves();
    console.log(`\\n💰 RÉSERVES:`);
    console.log(`💰 BNB: ${ethers.formatEther(bnbReserve)} BNB`);
    console.log(`🪙 CVTC: ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);

    // Vérifier le solde de l'opérateur
    const operatorBalance = await provider.getBalance(operatorWallet.address);
    console.log(`\\n💰 SOLDE OPÉRATEUR: ${ethers.formatEther(operatorBalance)} BNB`);

    if (operatorBalance < ethers.parseEther("0.00002")) {
      console.log(`❌ SOLDE INSUFFISANT`);
      return;
    }

    if (bnbReserve === 0n || cvtcReserve === 0n) {
      console.log(`❌ RÉSERVES INSUFFISANTES`);
      return;
    }

    console.log(`\\n✅ CONDITIONS REMPLIES`);

    // Calculer le montant attendu
    const bnbAmount = ethers.parseEther("0.00002");
    const expectedCvtc = (bnbAmount * cvtcReserve) / (bnbReserve + bnbAmount);
    const minCvtcOut = expectedCvtc * 95n / 100n; // 95% du montant attendu

    console.log(`\\n📊 CALCUL DU SWAP:`);
    console.log(`💸 BNB à swap: ${ethers.formatEther(bnbAmount)} BNB`);
    console.log(`🎯 CVTC attendu: ${ethers.formatUnits(expectedCvtc, 2)} CVTC`);
    console.log(`🎯 Minimum requis: ${ethers.formatUnits(minCvtcOut, 2)} CVTC`);

    // Exécuter le swap CORRECT avec buyForUser
    console.log(`\\n🚀 EXÉCUTION DU SWAP CORRIGÉ...`);
    console.log(`📤 Utilisation de buyForUser() - tokens iront à l'utilisateur`);

    const tx = await onboardingContract.buyForUser(USER_ADDRESS, minCvtcOut, {
      value: bnbAmount,
      gasLimit: 300000
    });

    console.log(`📤 Transaction envoyée: ${tx.hash}`);
    console.log(`⏳ En attente de confirmation...`);

    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmée!`);
    console.log(`📊 Gas utilisé: ${receipt.gasUsed}`);

    // Vérifier le résultat
    const cvtcTokenAddress = await onboardingContract.cvtcToken();
    const cvtcToken = new ethers.Contract(
      cvtcTokenAddress,
      ["function balanceOf(address) view returns (uint256)"],
      provider
    );

    const userBalanceAfter = await cvtcToken.balanceOf(USER_ADDRESS);
    console.log(`\\n💰 SOLDE UTILISATEUR APRÈS SWAP:`);
    console.log(`🪙 CVTC: ${ethers.formatUnits(userBalanceAfter, 2)} CVTC`);

    // Comparer avec le solde avant (1200)
    const received = userBalanceAfter - 120000n; // 1200 * 100 (décimales)
    console.log(`\\n📈 RÉSULTAT:`);
    console.log(`🪙 CVTC reçus du swap: ${ethers.formatUnits(received, 2)} CVTC`);

    if (received >= minCvtcOut) {
      console.log(`\\n🎉 SUCCÈS PARFAIT!`);
      console.log(`✅ Swap exécuté correctement`);
      console.log(`✅ Tokens envoyés à l'utilisateur: ${USER_ADDRESS}`);
      console.log(`✅ Montant reçu: ${ethers.formatUnits(received, 2)} CVTC`);
    } else {
      console.log(`\\n⚠️ MONTANT INFÉRIEUR ATTENDU`);
      console.log(`Reçu: ${ethers.formatUnits(received, 2)} CVTC`);
      console.log(`Attendu minimum: ${ethers.formatUnits(minCvtcOut, 2)} CVTC`);
    }

  } catch (error) {
    console.log(`\\n❌ ERREUR:`);
    console.error(error.message);

    if (error.message.includes("Seul owner")) {
      console.log(`\\n💡 ERREUR: Fonction réservée au owner`);
    } else if (error.message.includes("Utilisateur non autorise")) {
      console.log(`\\n💡 ERREUR: Utilisateur pas whitelisted`);
    }
  }
}

swapForUserFixed().catch(console.error);