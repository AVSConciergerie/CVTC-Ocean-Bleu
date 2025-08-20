// Stub pour simuler création wallet Privy

export async function createWallet(email) {
  // Ici tu peux appeler l'API Privy réelle
  // Pour l’instant on simule un wallet id unique
  return {
    walletId: 'wallet_' + Math.random().toString(36).substr(2, 9),
    createdFor: email,
  };
}