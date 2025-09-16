import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, X, Plus } from 'lucide-react';
import { usePimlico } from '../context/PimlicoContext';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import ThemeToggle from '../components/ui/ThemeToggle';
import CustomDatePicker from '../components/CustomDatePicker';
import { useContacts } from '../hooks/useContacts';
import { useTransfer } from '../hooks/useTransfer';
import { formatReunionDateTime } from '../utils/dateUtils';




export default function P2PTransferPage() {
  const { smartAccount, smartAccountAddress, account, bundler, config, isMultiOwner, error: pimlicoError } = usePimlico();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  // Use custom hooks
  const contactHook = useContacts();

  // Current Reunion time for display
  const currentReunionTime = formatReunionDateTime(new Date());
  const transferHook = useTransfer(smartAccount, smartAccountAddress, wallets, isMultiOwner, bundler, config, account);




  const [activeTab, setActiveTab] = useState('standard');














  return (
    <>
      <ThemeToggle />
      <div className="p-8 text-text-primary">
        <Link to="/fonctionnalites" className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary mb-8">
          <ArrowLeft size={18} />
          Retour aux Fonctionnalités
        </Link>

        <div className="max-w-2xl mx-auto">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-heading">
                Transferts Directs CVTC
              </h1>
              <p className="text-text-secondary mt-2">
                Transferts sécurisés et instantanés de CVTC.
              </p>
               <div className="mt-4 p-3 bg-gradient-to-br from-slate-900/30 via-blue-950/20 to-slate-900/30 backdrop-blur-sm border border-slate-700/40 rounded-xl inline-block">
                 <div className="text-xs text-slate-400 flex items-center gap-2">
                   <div className="w-2 h-2 bg-blue-400/60 rounded-full animate-pulse"></div>
                   <span className="text-blue-300 font-medium">{currentReunionTime}</span>
                   <span className="text-slate-500">UTC+4</span>
                 </div>
               </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-br from-card-bg/80 to-card-bg/60 border border-card-border rounded-xl backdrop-blur-sm shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-heading flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  Informations du Compte
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-slate-900/40 via-emerald-950/30 to-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${smartAccountAddress ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}></div>
                    <span className="text-sm font-medium text-slate-300">Smart Account</span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    {smartAccountAddress ? (
                      <>
                        <div className="font-mono break-all text-emerald-400">{smartAccountAddress}</div>
                        <div className="text-green-400">
                          {smartAccount ? '✅ ERC-4337 Activé' : '✅ Transactions Classiques'}
                        </div>
                      </>
                    ) : (
                      <div className="text-yellow-400">⏳ Initialisation...</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gradient-to-br from-slate-900/40 via-amber-950/30 to-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${transferHook.balance !== null ? 'bg-green-400' : 'bg-blue-400'} animate-pulse`}></div>
                    <span className="text-sm font-medium text-slate-300">Solde CVTC</span>
                  </div>
                   <button
                     onClick={transferHook.checkBalance}
                     disabled={transferHook.isLoadingBalance || (!smartAccountAddress && !ready)}
                     className="text-xs px-3 py-1 bg-accent/20 text-accent rounded-md hover:bg-accent/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                   >
                     {transferHook.isLoadingBalance ? '🔄' : '🔄 Actualiser'}
                   </button>
                </div>
                <div className="text-lg font-bold text-amber-400">
                   {transferHook.balance !== null ? `${transferHook.balance} CVTC` : 'Chargement...'}
                 </div>
                 <div className="text-xs text-slate-400 mt-1">
                   {transferHook.isLoadingBalance ? 'Mise à jour en cours...' : 'Dernière mise à jour automatique'}
                 </div>
              </div>

              {(pimlicoError || transferHook.error) && (
                 <div className="mt-4 p-3 bg-red-950/30 border border-red-700/50 rounded-lg">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                     <span className="text-sm font-medium text-red-400">Erreurs détectées</span>
                   </div>
                   <div className="text-xs text-red-300 space-y-1">
                     {pimlicoError && <div>Smart Account: {pimlicoError}</div>}
                     {transferHook.error && <div>Transfert: {transferHook.error}</div>}
                   </div>
                 </div>
               )}
            </div>

          <div className="mt-8">
            <div className="flex border-b border-card-border">
              <button
                onClick={() => setActiveTab('standard')}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === 'standard'
                    ? 'border-b-2 border-accent text-accent'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setActiveTab('advanced')}
                disabled={true} // Fonctionnalité désactivée
                className={`px-6 py-3 font-medium text-sm cursor-not-allowed ${
                  activeTab === 'advanced'
                    ? 'border-b-2 border-gray-500 text-gray-500'
                    : 'text-gray-500'
                }`}
                title="Bientôt disponible"
              >
                Avancé (Bientôt disponible)
              </button>
            </div>

            <div className="mt-6">
              {activeTab === 'standard' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Destinataires</label>
                    <div className="flex gap-2">
                      <div className="flex-grow relative">
                        <input
                          type="text"
                          value={transferHook.currentAddress}
                          onChange={(e) => {
                            transferHook.setCurrentAddress(e.target.value);
                            contactHook.recognizeContact(e.target.value);
                          }}
                          placeholder="0x... ou sélectionnez un contact"
                          className="w-full p-2 rounded-md bg-card-bg border border-card-border focus:ring-2 focus:ring-accent focus:outline-none"
                        />
                        {contactHook.recognizedContact ? (
                          <div className="absolute right-2 top-2 flex items-center gap-1">
                            <span className="text-green-400 text-sm"> {contactHook.recognizedContact.name}</span>
                            <button
                              onClick={() => contactHook.startEditing(contactHook.recognizedContact)}
                              className="text-blue-400 hover:text-blue-300 text-xs"
                              title="Renommer ce contact"
                            >
                              ✏️
                            </button>
                          </div>
                         ) : transferHook.currentAddress && transferHook.currentAddress.length > 10 && !contactHook.recognizedContact ? (
                           <div className="absolute right-2 top-2 z-10">
                             <button
                               onClick={() => {
                                 console.log('🖱️ Bouton + Contact cliqué pour:', transferHook.currentAddress);
                                 contactHook.setShowAddContactForm(true);
                                 contactHook.setNewContactName('');
                               }}
                               className="text-accent hover:text-accent-hover text-xs bg-accent/10 hover:bg-accent/20 px-2 py-1 rounded border border-accent/20 hover:border-accent/40 transition-all duration-200 cursor-pointer"
                               title="Ajouter comme contact"
                             >
                               + Contact
                             </button>
                           </div>
                         ) : null}
                      </div>
                       <button
                         onClick={() => {
                           console.log('🖱️ Bouton + destinataire cliqué avec:', transferHook.currentAddress);
                           transferHook.handleAddRecipient();
                         }}
                         disabled={!transferHook.currentAddress || transferHook.currentAddress.trim() === ''}
                         className="p-2 bg-accent/20 text-accent rounded-md hover:bg-accent/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent/20"
                         title={!transferHook.currentAddress || transferHook.currentAddress.trim() === '' ? 'Entrez une adresse valide' : 'Ajouter destinataire'}
                       >
                         <Plus size={20} />
                       </button>
                    </div>

                    {contactHook.showAddContactForm && (
                       <div className="mt-2 p-3 bg-accent/5 border border-accent/20 rounded-md">
                         <p className="text-sm text-accent mb-2">Ajouter cette adresse comme contact :</p>
                         <div className="flex gap-2">
                           <input
                             type="text"
                             placeholder="Nom du contact"
                             value={contactHook.newContactName}
                             onChange={(e) => contactHook.setNewContactName(e.target.value)}
                             className="flex-1 px-3 py-2 text-sm rounded-md bg-card-bg border border-card-border focus:ring-2 focus:ring-accent focus:outline-none"
                             autoFocus
                           />
                            <button
                              onClick={() => {
                                console.log('🖱️ Bouton Ajouter contact cliqué');
                                if (contactHook.newContactName.trim()) {
                                  console.log('📝 Ajout contact:', transferHook.currentAddress, contactHook.newContactName.trim());
                                  contactHook.addContact(transferHook.currentAddress, contactHook.newContactName.trim());
                                  transferHook.setCurrentAddress('');
                                  contactHook.setShowAddContactForm(false);
                                }
                              }}
                              disabled={!contactHook.newContactName || contactHook.newContactName.trim() === ''}
                              className="px-4 py-2 bg-accent text-white text-sm rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Ajouter
                            </button>
                           <button
                             onClick={() => contactHook.setShowAddContactForm(false)}
                             className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                           >
                             Annuler
                           </button>
                         </div>
                       </div>
                     )}

                    <div className="mt-2 space-y-2">
                       {transferHook.recipients.map(address => (
                         <div key={address} className="flex items-center justify-between bg-card-bg/50 p-2 rounded-md text-sm">
                           <span className="font-mono">{address}</span>
                           <button onClick={() => transferHook.handleRemoveRecipient(address)} className="text-red-500 hover:text-red-400">
                             <X size={16} />
                           </button>
                         </div>
                       ))}
                     </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Montant en CVTC</label>
                    <input
                      type="number"
                      value={transferHook.amount}
                      onChange={(e) => transferHook.setAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full p-2 rounded-md bg-card-bg border border-card-border focus:ring-2 focus:ring-accent focus:outline-none"
                    />
                  </div>

                   <div className="flex justify-center mt-6">
                     <button
                       onClick={transferHook.handleSend}
                       disabled={transferHook.isSending || transferHook.recipients.length === 0 || !transferHook.amount || !ready || !authenticated}
                       className="px-8 py-3 bg-gradient-to-r from-accent to-accent-hover text-white rounded-lg hover:from-accent-hover hover:to-accent disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                     >
                       {transferHook.isSending ? 'Transaction en cours...' : `🚀 Transférer ${transferHook.amount || 0} CVTC`}
                     </button>
                   </div>
                </div>
              )}

              {transferHook.recipients.length > 0 && parseFloat(transferHook.amount) > 0 && (
                <div className="mt-8 p-6 bg-gradient-to-br from-card-bg/80 to-card-bg/60 border border-card-border rounded-xl backdrop-blur-sm shadow-lg">
                   <h3 className="font-bold text-slate-200 mb-4">
                     Aperçu de votre Transfert
                   </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                     <div className="p-4 bg-gradient-to-br from-slate-900/40 via-blue-950/30 to-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl">
                       <p className="text-slate-300 font-medium mb-2">
                         Montant total
                       </p>
                       <p className="text-2xl font-bold text-blue-300">{parseFloat(transferHook.amount).toFixed(2)} CVTC</p>
                       <p className="text-xs text-slate-400 mt-1">Paiement intégral immédiat</p>
                     </div>

                     <div className="p-4 bg-gradient-to-br from-slate-900/40 via-emerald-950/30 to-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl">
                       <p className="text-slate-300 font-medium mb-2">
                         Destinataires
                       </p>
                       <p className="text-2xl font-bold text-emerald-300">{transferHook.recipients.length}</p>
                       <p className="text-xs text-slate-400 mt-1">Adresse{transferHook.recipients.length > 1 ? 's' : ''} sélectionnée{transferHook.recipients.length > 1 ? 's' : ''}</p>
                     </div>

                     <div className="p-4 bg-gradient-to-br from-slate-900/40 via-indigo-950/30 to-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-xl">
                       <p className="text-slate-300 font-medium mb-2">
                         Calendrier
                       </p>
                       <p className="text-lg font-bold text-indigo-300">
                         Immédiat
                       </p>
                       <p className="text-xs text-slate-400 mt-1">
                         Transfert direct
                       </p>
                     </div>
                  </div>


                </div>
              )}

              {activeTab === 'advanced' && (
                <div className="p-8 text-center bg-gradient-to-br from-card-bg/80 to-card-bg/60 border border-card-border rounded-xl backdrop-blur-sm shadow-lg">
                  <h3 className="text-lg font-semibold text-heading mb-4">Bientôt disponible</h3>
                  <p className="text-text-secondary">
                    La fonctionnalité de transferts planifiés est en cours de développement.
                  </p>
                  <p className="text-text-secondary mt-2">
                    Elle sera disponible après le déploiement et la validation du contrat intelligent `CVTCScheduler`.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 space-y-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-lg font-semibold text-heading">Carnet d'adresses</label>
                <button
                  onClick={() => contactHook.setShowContacts(!contactHook.showContacts)}
                  className="text-sm text-accent hover:text-accent-hover underline decoration-accent/30 hover:decoration-accent transition-all duration-200"
                >
                  {contactHook.showContacts ? 'Masquer' : 'Voir'} carnet d'adresses ({contactHook.contacts.length})
                </button>
              </div>

              {contactHook.showContacts && (
                <div className="p-4 bg-gradient-to-br from-card-bg/80 to-card-bg/60 border border-card-border rounded-xl backdrop-blur-sm shadow-lg">
                  <h4 className="text-base font-semibold text-heading mb-4 flex items-center gap-2">
                    📱 Mes Contacts
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-accent/20 scrollbar-track-transparent">
                    {contactHook.contacts.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">📭</div>
                        <p className="text-sm text-text-secondary">
                          Aucun contact sauvegardé. Effectuez un transfert puis sauvegardez le destinataire !
                        </p>
                      </div>
                    ) : (
                      contactHook.contacts.map((contact, index) => (
                        <div key={index} className="p-3 bg-gradient-to-r from-card-bg/50 to-card-bg/30 border border-card-border/50 rounded-lg hover:border-accent/30 transition-all duration-200">
                          {contactHook.editingContact === contact.address ? (
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={contactHook.editName}
                                  onChange={(e) => contactHook.setEditName(e.target.value)}
                                  className="flex-1 px-3 py-2 text-sm bg-card-bg border border-card-border rounded-md focus:ring-2 focus:ring-accent focus:outline-none"
                                  placeholder="Nouveau nom"
                                  autoFocus
                                />
                                <button
                                  onClick={() => contactHook.updateContact(contact.address, contactHook.editName)}
                                  className="px-3 py-2 bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/30 transition-colors duration-200"
                                >
                                  ✅
                                </button>
                                <button
                                  onClick={contactHook.cancelEditing}
                                  className="px-3 py-2 bg-gray-500/20 text-gray-400 rounded-md hover:bg-gray-500/30 transition-colors duration-200"
                                >
                                  ❌
                                </button>
                              </div>
                              <p className="text-xs text-text-secondary font-mono break-all">{contact.address}</p>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-accent truncate">{contact.name}</span>
                                  <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                                    {contact.transferCount} transfert{contact.transferCount > 1 ? 's' : ''}
                                  </span>
                                </div>
                                <p className="text-xs text-text-secondary font-mono break-all mb-1">{contact.address}</p>
                                <p className="text-xs text-text-secondary">
                                  Dernier: {new Date(contact.lastTransfer).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              <div className="flex gap-2 ml-4">
                                 <button
                                   onClick={() => {
                                     console.log('🖱️ Bouton Sélectionner cliqué pour:', contact.name, contact.address);
                                     contactHook.selectContact(contact, transferHook.setCurrentAddress);
                                   }}
                                   className="text-xs px-3 py-2 bg-accent/20 text-accent rounded-md hover:bg-accent/30 transition-colors duration-200 font-medium"
                                   title="Sélectionner ce contact"
                                 >
                                   Sélectionner
                                 </button>
                                <button
                                  onClick={() => contactHook.startEditing(contact)}
                                  className="text-xs px-3 py-2 bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/30 transition-colors duration-200"
                                  title="Renommer le contact"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => contactHook.removeContact(contact.address)}
                                  className="text-xs px-3 py-2 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 transition-colors duration-200"
                                  title="Supprimer le contact"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {transferHook.error && (
            <div className="mt-4 p-3 rounded-lg bg-red-900/50 border border-red-400 text-center">
              <p className="text-red-400 text-sm">❌ Erreur de transfert</p>
              <p className="text-text-secondary text-xs break-words">{transferHook.error}</p>
            </div>
          )}

          <div className="text-center mt-12">
            <p className="text-xs text-text-secondary">💡 Conseil : Vérifiez toujours l'adresse du bénéficiaire pour une sécurité optimale.</p>
          </div>
        </div>
      </div>
    </>
  );
}