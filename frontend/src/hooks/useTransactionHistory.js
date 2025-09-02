import { useState, useEffect } from 'react';
import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { bscTestnet } from 'viem/chains';

const CVTC_TOKEN_ADDRESS = '0x532FC49071656C16311F2f89E6e41C53243355D3';

// ABI event pour les transferts ERC20
const transferEventAbi = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(),
});

export const useTransactionHistory = (smartAccountAddress) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactionHistory = async () => {
    if (!smartAccountAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔍 Simulation de l'historique pour ${smartAccountAddress}`);
      
      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Données mocкées basées sur vos transactions réelles connues
      // En attendant une solution RPC plus robuste (The Graph, RPC privé, etc.)
      const mockTransactions = [
        {
          id: '0xdb125524fafc183b58b235a191d5cc026652401e29d56ac2a7a82776aa67b328-0',
          hash: '0xdb125524fafc183b58b235a191d5cc026652401e29d56ac2a7a82776aa67b328',
          blockNumber: 63844000, // Approximation
          timestamp: Date.now() - (30 * 60 * 1000), // Il y a 30 minutes
          type: 'sent',
          amount: 4.00,
          from: smartAccountAddress,
          to: '0xfc62525a23197922002f30863ef7b2d91b6576d0',
          otherParty: '0xfc62525a23197922002f30863ef7b2d91b6576d0',
          status: 'confirmed',
        },
        {
          id: '0x5f35f29ea5dc22470d599b2efc9a7f1b8b07e636b44f75c6f4ec0e1c6d63c3d1-0',
          hash: '0x5f35f29ea5dc22470d599b2efc9a7f1b8b07e636b44f75c6f4ec0e1c6d63c3d1',
          blockNumber: 63816886,
          timestamp: Date.now() - (5 * 60 * 60 * 1000), // Il y a 5 heures
          type: 'received',
          amount: 14.00,
          from: '0xfc62525a23197922002f30863ef7b2d91b6576d0',
          to: smartAccountAddress,
          otherParty: '0xfc62525a23197922002f30863ef7b2d91b6576d0',
          status: 'confirmed',
        },
      ];

      // Trier par timestamp décroissant (plus récent en premier)
      const sortedTransactions = mockTransactions.sort((a, b) => b.timestamp - a.timestamp);
      
      setTransactions(sortedTransactions);
      
      console.log('✨ Historique simulé chargé avec succès');
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'historique:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionHistory();
  }, [smartAccountAddress]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactionHistory,
  };
};
