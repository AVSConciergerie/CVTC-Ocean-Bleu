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

async function forceFirstSwap() {
  console.log("🚀 FORÇAGE PREMIER SWAP");
  console.log("=======================");

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
    // Vérifier le solde de l'opérateur
    const operatorBalance = await provider.getBalance(operatorWallet.address);
    console.log(`\\n💰 Solde opérateur: ${ethers.formatEther(operatorBalance)} BNB`);

    // Vérifier les réserves du contrat
    const [bnbReserve, cvtcReserve] = await onboardingContract.getReserves();
    console.log(`💰 Réserves BNB: ${ethers.formatEther(bnbReserve)} BNB`);
    console.log(`🪙 Réserves CVTC: ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);

    // Vérifier si l'utilisateur est whitelisted
    console.log(`\\n🔍 VÉRIFICATION WHITELIST...`);
    // Note: On ne peut pas lire directement la whitelist, on va essayer le swap

    if (operatorBalance < ethers.parseEther("0.001")) {
      console.log(`❌ SOLDE INSUFFISANT: ${ethers.formatEther(operatorBalance)} BNB`);
      console.log(`Minimum requis: 0.001 BNB`);
      return;
    }

    if (bnbReserve === 0n || cvtcReserve === 0n) {
      console.log(`❌ RÉSERVES INSUFFISANTES`);
      console.log(`BNB: ${ethers.formatEther(bnbReserve)} BNB`);
      console.log(`CVTC: ${ethers.formatUnits(cvtcReserve, 2)} CVTC`);
      return;
    }

    console.log(`\\n✅ CONDITIONS REMPLIES`);
    console.log(`🔄 Exécution du premier swap forcé...`);

    // Calculer le montant minimum attendu
    const bnbAmount = ethers.parseEther("0.00002");
    const minCvtcOut = 1000; // Minimum 10 CVTC

    console.log(`💸 Swap: ${ethers.formatEther(bnbAmount)} BNB`);
    console.log(`🎯 Minimum CVTC: ${minCvtcOut / 100} CVTC`);

    // Exécuter le swap
    const tx = await onboardingContract.buy(minCvtcOut, {
      value: bnbAmount,
      gasLimit: 300000
    });

    console.log(`📤 Transaction envoyée: ${tx.hash}`);
    console.log(`⏳ En attente de confirmation...`);

    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmée!`);
    console.log(`📊 Gas utilisé: ${receipt.gasUsed}`);

    // Vérifier le solde de l'utilisateur après le swap
    const cvtcTokenAddress = await onboardingContract.cvtcToken();
    const cvtcToken = new ethers.Contract(
      cvtcTokenAddress,
      ["function balanceOf(address) view returns (uint256)"],
      provider
    );

    const newBalance = await cvtcToken.balanceOf(USER_ADDRESS);
    console.log(`\\n💰 NOUVEAU SOLDE UTILISATEUR:`);
    console.log(`🪙 CVTC: ${ethers.formatUnits(newBalance, 2)} CVTC`);

    const expectedBalance = ethers.parseUnits("2500000000", 2);
    console.log(`\\n🎯 SOLDE ATTENDU:`);
    console.log(`📊 Selon calcul: ${ethers.formatUnits(expectedBalance, 2)} CVTC`);

    if (newBalance >= expectedBalance) {
      console.log(`\\n🎉 SUCCÈS!`);
      console.log(`Le premier swap a été exécuté correctement`);
      console.log(`L'utilisateur a maintenant ${ethers.formatUnits(newBalance, 2)} CVTC`);
    } else {
      console.log(`\\n⚠️ MONTANT INFÉRIEUR ATTENDU`);
      console.log(`Reçu: ${ethers.formatUnits(newBalance, 2)} CVTC`);
      console.log(`Attendu: ${ethers.formatUnits(expectedBalance, 2)} CVTC`);
    }

  } catch (error) {
    console.log(`\\n❌ ERREUR:`);
    console.error(error.message);

    if (error.message.includes("not authorised")) {
      console.log(`\\n💡 L'utilisateur n'est pas whitelisted`);
      console.log(`Il faut d'abord whitelister l'utilisateur`);
    } else if (error.message.includes("insufficient funds")) {
      console.log(`\\n💡 Solde opérateur insuffisant`);
      console.log(`Il faut ajouter des BNB à l'opérateur`);
    }
  }
}

forceFirstSwap().catch(console.error);