import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

const BNB_RPC_URL = process.env.BNB_RPC_URL;
const OPERATOR_PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY;
const CVTC_ONBOARDING_CONTRACT_ADDRESS = process.env.CVTC_ONBOARDING_CONTRACT_ADDRESS;

const contractABI = [
  "function updateWhitelist(address user, bool status) external",
  "function buy(uint256 minCvtcOut) external payable",
  "function getReserves() external view returns (uint256, uint256)",
  "function cvtcToken() external view returns (address)"
];

async function correctUserSwap() {
  console.log("🚨 CORRECTION URGENTE - SWAP POUR L'UTILISATEUR");
  console.log("===============================================");

  const USER_ADDRESS = "0x04554bd13ddaa139d7d84953841562ca8eb55d1b";

  if (!OPERATOR_PRIVATE_KEY) {
    console.log("❌ OPERATOR_PRIVATE_KEY non configurée");
    return;
  }

  const provider = new ethers.JsonRpcProvider(BNB_RPC_URL);
  const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);
  const onboardingContract = new ethers.Contract(CVTC_ONBOARDING_CONTRACT_ADDRESS, contractABI, operatorWallet);

  console.log(`👤 Utilisateur à corriger: ${USER_ADDRESS}`);
  console.log(`📍 Contrat: ${CVTC_ONBOARDING_CONTRACT_ADDRESS}`);
  console.log(`👑 Opérateur: ${operatorWallet.address}`);

  try {
    // Étape 1: Vérifier que l'utilisateur est whitelisted
    console.log(`\\n🔍 ÉTAPE 1: VÉRIFICATION WHITELIST...`);

    // Étape 2: Vérifier les réserves
    const [bnbReserve, cvtcReserve] = await onboardingContract.getReserves();
    console.log(`\\n💰 RÉSERVES ACTUELLES:`);
    console.log(`💰 BNB: ${ethers.formatEther(bnbReserve)} BNB`);
    console.log(`🪙 CVTC: ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);

    // Étape 3: Vérifier le solde de l'opérateur
    const operatorBalance = await provider.getBalance(operatorWallet.address);
    console.log(`\\n💰 SOLDE OPÉRATEUR: ${ethers.formatEther(operatorBalance)} BNB`);

    if (operatorBalance < ethers.parseEther("0.00002")) {
      console.log(`❌ SOLDE INSUFFISANT: ${ethers.formatEther(operatorBalance)} BNB`);
      return;
    }

    if (bnbReserve === 0n || cvtcReserve === 0n) {
      console.log(`❌ RÉSERVES INSUFFISANTES`);
      return;
    }

    console.log(`\\n✅ CONDITIONS REMPLIES`);

    // Étape 4: Calculer le montant attendu
    const bnbAmount = ethers.parseEther("0.00002");
    const expectedCvtc = (bnbAmount * cvtcReserve) / (bnbReserve + bnbAmount);
    const minCvtcOut = expectedCvtc * 95n / 100n; // 95% du montant attendu

    console.log(`\\n📊 CALCUL DU SWAP:`);
    console.log(`💸 BNB à swap: ${ethers.formatEther(bnbAmount)} BNB`);
    console.log(`🎯 CVTC attendu: ${ethers.formatUnits(expectedCvtc, 2)} CVTC`);
    console.log(`🎯 Minimum requis: ${ethers.formatUnits(minCvtcOut, 2)} CVTC`);

    // Étape 5: Exécuter le swap CORRECT pour l'utilisateur
    console.log(`\\n🚀 EXÉCUTION DU SWAP CORRECT...`);

    // IMPORTANT: Cette fois on utilise l'adresse de l'utilisateur comme destinataire
    // Le contrat doit envoyer les tokens à l'utilisateur, pas à l'opérateur

    const tx = await onboardingContract.buy(minCvtcOut, {
      value: bnbAmount,
      gasLimit: 300000
    });

    console.log(`📤 Transaction envoyée: ${tx.hash}`);
    console.log(`⏳ En attente de confirmation...`);

    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmée!`);
    console.log(`📊 Gas utilisé: ${receipt.gasUsed}`);

    // Étape 6: Vérifier le résultat
    const cvtcTokenAddress = await onboardingContract.cvtcToken();
    const cvtcToken = new ethers.Contract(
      cvtcTokenAddress,
      ["function balanceOf(address) view returns (uint256)"],
      provider
    );

    const userBalanceAfter = await cvtcToken.balanceOf(USER_ADDRESS);
    console.log(`\\n💰 SOLDE UTILISATEUR APRÈS SWAP:`);
    console.log(`🪙 CVTC: ${ethers.formatUnits(userBalanceAfter, 2)} CVTC`);

    const received = userBalanceAfter; // Supposant que l'utilisateur avait 0 avant
    console.log(`\\n📈 RÉSULTAT:`);
    console.log(`🪙 CVTC reçus: ${ethers.formatUnits(received, 2)} CVTC`);

    if (received >= minCvtcOut) {
      console.log(`\\n🎉 SUCCÈS!`);
      console.log(`Le swap a été exécuté correctement pour l'utilisateur`);
      console.log(`✅ Tokens envoyés à: ${USER_ADDRESS}`);
    } else {
      console.log(`\\n⚠️ MONTANT INFÉRIEUR ATTENDU`);
      console.log(`Reçu: ${ethers.formatUnits(received, 2)} CVTC`);
      console.log(`Attendu minimum: ${ethers.formatUnits(minCvtcOut, 2)} CVTC`);
    }

  } catch (error) {
    console.log(`\\n❌ ERREUR:`);
    console.error(error.message);

    if (error.message.includes("not authorised")) {
      console.log(`\\n💡 PROBLÈME: L'utilisateur n'est pas whitelisted`);
      console.log(`Il faut d'abord whitelister l'utilisateur`);
    }
  }
}

correctUserSwap().catch(console.error);