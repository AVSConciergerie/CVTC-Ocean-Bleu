import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { createPublicClient, http, formatUnits } from 'viem';
import { bscTestnet } from 'viem/chains';
import { usePimlico } from '../context/PimlicoContext';

const publicClient = createPublicClient({
  transport: http("https://data-seed-prebsc-1-s1.binance.org:8545/"),
  chain: bscTestnet,
});

const CVTC_ADDRESS = '0x532FC49071656C16311F2f89E6e41C53243355D3';

const erc20Abi = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
];

export default function InformationPage() {
  const { user } = usePrivy();
  const { smartAccountAddress } = usePimlico();
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(null);
  const [cvtcBalance, setCvtcBalance] = useState(null);

  useEffect(() => {
    const termsStatus = localStorage.getItem('termsAccepted');
    const onboardingStatusValue = localStorage.getItem('onboardingStatus');
    const startDateStr = localStorage.getItem('onboardingStartDate');

    // Vérifier si les conditions générales ont été acceptées
    if (termsStatus === 'true') {
      setTermsAccepted(true);
    }

    // Vérifier le statut d'onboarding
    if (onboardingStatusValue === 'accepted') {
      setOnboardingStatus('accepted');
    }

    // Calculer les jours restants
    if (startDateStr) {
      const startDate = new Date(startDateStr);
      const now = new Date();
      const diffTime = now - startDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const remaining = Math.max(0, 30 - diffDays);
      setDaysRemaining(remaining);
    }

    // Fetch CVTC balance
    const fetchBalance = async () => {
      const address = smartAccountAddress || user?.wallet?.address;
      if (address) {
        try {
          const balance = await publicClient.readContract({
            address: CVTC_ADDRESS,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [address],
          });
          const decimals = await publicClient.readContract({
            address: CVTC_ADDRESS,
            abi: erc20Abi,
            functionName: 'decimals',
          });
          const formattedBalance = formatUnits(balance, decimals);
          setCvtcBalance(parseFloat(formattedBalance).toFixed(2));
        } catch (error) {
          console.error('Erreur lors de la récupération du solde CVTC:', error);
        }
      }
    };

    fetchBalance();
  }, [user, smartAccountAddress]);

  return (
    <div className="p-8 text-text-primary relative">
      <Link to="/" className="absolute top-4 left-4 text-sm text-text-secondary hover:text-text-primary">
        Accueil
      </Link>
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary mb-8">
        <ArrowLeft size={18} />
        Retour au Dashboard
      </Link>
      
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-heading">Information</h1>
          <p className="mt-2">
            Détails techniques, contrats et statut de votre compte.
          </p>
        </div>

        <div className="border-t border-card-border my-8"></div>

        <div>
          <h2 className="text-xl font-bold text-heading">Statut de l'Onboarding</h2>
           {termsAccepted && onboardingStatus === 'accepted' && daysRemaining === 0 ? (
             <div className="mt-4 flex items-center gap-3 text-green-400 bg-green-900/50 border border-green-400/30 rounded-lg p-4">
               <CheckCircle size={24} />
               <p className="font-semibold">Onboarding terminé ! Votre compte est pleinement actif.</p>
             </div>
           ) : termsAccepted && onboardingStatus === 'accepted' ? (
             <div className="mt-4 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
               <p className="text-blue-200">
                 🔄 Onboarding en cours... Les conditions ont été acceptées, l'initialisation se termine.
               </p>
               {daysRemaining !== null && (
                 <p className="text-blue-200 mt-2">
                   📅 Jours restants : {daysRemaining} jours
                 </p>
               )}
               {cvtcBalance !== null && (
                 <p className="text-blue-200 mt-2">
                   💰 Solde acquis en CVTC : {cvtcBalance} CVTC
                 </p>
               )}
             </div>
           ) : termsAccepted ? (
             <div className="mt-4 p-4 bg-orange-900/20 border border-orange-600/30 rounded-lg">
               <p className="text-orange-200">
                 🚀 Veuillez accepter l'onboarding depuis le Dashboard pour commencer le processus de 30 jours.
               </p>
             </div>
           ) : (
             <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
               <p className="text-yellow-200">
                 ⚠️ Veuillez d'abord accepter les conditions d'utilisation depuis le Dashboard pour finaliser votre onboarding.
               </p>
             </div>
           )}
        </div>

         {/* Ici, on pourra ajouter les adresses des contrats plus tard */}
      </div>
    </div>
  );
}
