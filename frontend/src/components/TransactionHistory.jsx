import React from 'react';
import { ExternalLink, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import { useTransactionHistory } from '../hooks/useTransactionHistory';

const TransactionHistory = ({ smartAccountAddress }) => {
  const { transactions, isLoading, error, refetch } = useTransactionHistory(smartAccountAddress);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTypeIcon = (type) => {
    return type === 'sent' ? (
      <ArrowUpRight className="w-4 h-4 text-red-400" />
    ) : (
      <ArrowDownLeft className="w-4 h-4 text-green-400" />
    );
  };

  const getTypeColor = (type) => {
    return type === 'sent' ? 'text-red-400' : 'text-green-400';
  };

  if (!smartAccountAddress) {
    return (
      <div className="p-4 border border-gray-700 rounded-lg bg-gray-800/50">
        <h3 className="text-lg font-semibold text-heading mb-4">Historique des Transactions CVTC</h3>
        <p className="text-text-secondary">En attente du Smart Account...</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-700 rounded-lg bg-gray-800/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-heading">Historique des Transactions CVTC</h3>
          <p className="text-xs text-yellow-400 mt-1">
            🚧 Version démo - Historique simulé en attendant l'intégration The Graph
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={isLoading}
          className="p-2 text-accent hover:bg-accent/10 rounded-md transition-colors disabled:opacity-50"
          title="Actualiser l'historique"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-md">
          <p className="text-red-400 text-sm">❌ Erreur: {error}</p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-text-secondary py-4">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Chargement de l'historique...</span>
        </div>
      )}

      {!isLoading && transactions.length === 0 && !error && (
        <p className="text-text-secondary py-4">Aucune transaction CVTC trouvée.</p>
      )}

      {!isLoading && transactions.length > 0 && (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 bg-card-bg rounded-md border border-card-border hover:bg-card-bg/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getTypeIcon(tx.type)}
                
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${getTypeColor(tx.type)}`}>
                      {tx.type === 'sent' ? '-' : '+'}{tx.amount.toFixed(2)} CVTC
                    </span>
                    <span className="text-text-secondary text-xs px-2 py-1 bg-gray-700 rounded">
                      {tx.type === 'sent' ? 'Envoyé' : 'Reçu'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-text-secondary">
                    {tx.type === 'sent' ? 'vers' : 'de'} {formatAddress(tx.otherParty)}
                  </div>
                  
                  <div className="text-xs text-text-secondary">
                    {formatDate(tx.timestamp)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://testnet.bscscan.com/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-accent hover:bg-accent/10 rounded-md transition-colors"
                  title="Voir sur BSCScan"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}

          {transactions.length >= 10 && (
            <div className="text-center pt-2">
              <p className="text-xs text-text-secondary">
                Affichage des dernières transactions. 
                <button onClick={refetch} className="text-accent hover:underline ml-1">
                  Actualiser
                </button>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
