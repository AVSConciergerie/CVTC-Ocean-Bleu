import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useTransactionHistory } from '../hooks/useTransactionHistory';

const TransactionHistory = ({ smartAccountAddress }) => {
  const { isLoading, refetch } = useTransactionHistory(smartAccountAddress);

  if (!smartAccountAddress) {
    return (
      <div className="p-4 border border-gray-700 rounded-lg bg-gray-800">
        <h3 className="text-lg font-semibold text-heading mb-4">Historique des Transactions CVTC</h3>
        <p className="text-text-secondary">En attente du Smart Account...</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-700 rounded-lg bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-heading">Historique des Transactions CVTC</h3>
        </div>
        <button
          onClick={refetch}
          disabled={isLoading}
          className="p-2 text-accent hover:bg-accent rounded-md transition-colors disabled:opacity-50"
          title="Actualiser l'historique"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {isLoading && <div className="flex items-center gap-2 text-text-secondary py-4">
        <RefreshCw className="w-4 h-4" />
        <span>Chargement de l'historique...</span>
      </div>}

       <div className="flex justify-center pt-4">
         <a href={`https://testnet.bscscan.com/address/${smartAccountAddress}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent text-white font-medium rounded-md transition-colors">
           Voir les Transactions sur BSC Testnet
         </a>
       </div>
    </div>
  );
};

export default TransactionHistory;
