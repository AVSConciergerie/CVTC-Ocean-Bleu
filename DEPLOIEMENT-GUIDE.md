# 🚀 Guide de Déploiement - Système d'Onboarding CVTC

## 📋 Vue d'Ensemble

Ce guide vous accompagne pas à pas pour déployer le système d'onboarding CVTC sur BSC Testnet. Tout a été préparé pour un déploiement fluide et sécurisé.

### 🎯 Ce qui a été créé

✅ **Smart Contracts :**
- `CVTCOnboarding.sol` - Logique principale d'onboarding
- `CVTCSwap.sol` - Pool de swap invisible (existant, intégré)
- `CVTCPaymaster.sol` - Paiement gasless ERC-4337 (existant, intégré)

✅ **Scripts de déploiement :**
- `deploy-onboarding.ts` - Déploiement contrat onboarding
- `setup-invisible-swap-pool.ts` - Configuration pool swap
- `deploy-full-onboarding-system.ts` - Déploiement complet

✅ **Scripts de test :**
- `test-onboarding.ts` - Tests contrat onboarding
- Scripts de test pour chaque composant

✅ **Documentation d'audit :**
- Dossiers complets pour chaque contrat
- Analyses de sécurité détaillées
- Check-lists de vérification
- Plans de contingence

✅ **Documentation métier :**
- CGU conformes RGPD
- Spécifications fonctionnelles
- Architecture technique

---

## 🛠️ Préparation de l'Environnement

### 1. Installation des Dépendances
```bash
# Installer toutes les dépendances
npm install

# Vérifier l'installation
npx hardhat --version
```

### 2. Configuration BSC Testnet
```bash
# Créer le fichier .env
cp .env.example .env

# Éditer .env avec vos clés
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
PRIVATE_KEY=votre_clé_privée_sans_0x
PIMLICO_API_KEY=votre_clé_pimlico
CVTC_TOKEN_ADDRESS=0x532FC49071656C16311F2f89E6e41C53243355D3
```

### 3. Obtenir des Fonds Testnet
```bash
# BNB Testnet Faucet
# https://testnet.binance.org/faucet-smart

# CVTC Tokens (si nécessaire)
# Contacter l'équipe pour obtenir des CVTC testnet
```

---

## 🚀 Déploiement Étape par Étape

### Phase 1 : Tests Locaux (30 minutes)
```bash
# 1. Compiler tous les contrats
npx hardhat compile

# 2. Tests unitaires
npx hardhat test

# 3. Tests de couverture (optionnel)
npx hardhat coverage
```

### Phase 2 : Déploiement Pool de Swap (15 minutes)
```bash
# 1. Déployer le pool de swap
npx hardhat run scripts/setup-invisible-swap-pool.ts --network bscTestnet

# 2. Vérifier sur BSCScan
# Aller sur https://testnet.bscscan.com/
# Chercher l'adresse du contrat déployé

# 3. Sauvegarder l'adresse du pool
# Elle sera dans ./deployments/swap-pool-config.json
```

### Phase 3 : Déploiement Contrat Onboarding (15 minutes)
```bash
# 1. Mettre à jour l'adresse du pool dans le script
# Éditer scripts/deploy-onboarding.ts
const CVTC_SWAP_ADDRESS = "ADRESSE_DU_POOL_DEPLOYE";

# 2. Déployer le contrat onboarding
npx hardhat run scripts/deploy-onboarding.ts --network bscTestnet

# 3. Vérifier sur BSCScan
# Vérifier que les adresses sont correctes
```

### Phase 4 : Tests sur Testnet (30 minutes)
```bash
# 1. Tests d'intégration
npx hardhat run scripts/test-onboarding.ts --network bscTestnet

# 2. Tests manuels (optionnel)
# - Créer un wallet test
# - Appeler acceptOnboardingTerms()
# - Vérifier la réception de 0,30 BNB
# - Tester executeDailySwap()
```

---

## 🔍 Vérifications Post-Déploiement

### Check-list Sécurité
- [ ] Contrats vérifiés sur BSCScan
- [ ] Adresses sauvegardées dans deployments/
- [ ] Tests passent sur testnet
- [ ] Fonds suffisants pour opérations
- [ ] Clés privées sécurisées

### Check-list Fonctionnel
- [ ] acceptOnboardingTerms() fonctionne
- [ ] Prêt de 0,30 BNB versé
- [ ] executeDailySwap() s'exécute
- [ ] Paliers de remboursement activés
- [ ] Statistiques accessibles

### Check-list Intégration
- [ ] Pool de swap connecté
- [ ] CVTC token approuvé
- [ ] Paymaster configuré (si utilisé)
- [ ] Backend peut interagir

---

## 📊 Monitoring et Maintenance

### Métriques à Surveiller
```javascript
// Script de monitoring (à créer)
const monitoring = {
  totalUsers: await onboarding.totalUsers(),
  activeUsers: await onboarding.activeUsers(),
  totalLoans: await onboarding.totalLoansGiven(),
  contractBalance: await provider.getBalance(onboardingAddress),
  poolReserves: await swap.getReserves()
};
```

### Alertes à Configurer
- **Balance contrat** : < 1 BNB
- **Utilisateurs actifs** : Changement significatif
- **Échecs transactions** : > 5%
- **Gas price** : > seuil défini

### Mises à Jour d'Urgence
```solidity
// Fonctions d'urgence disponibles
function emergencyPause() external onlyOwner;
function emergencyWithdraw() external onlyOwner;
function emergencyCompleteOnboarding(address user) external onlyOwner;
```

---

## 🧪 Tests Utilisateur

### Scénario Test Complet
```javascript
// 1. Créer un wallet test
const testWallet = ethers.Wallet.createRandom();

// 2. Accepter les CGU
await onboarding.connect(testWallet).acceptOnboardingTerms();

// 3. Vérifier le prêt
const balance = await provider.getBalance(testWallet.address);
console.log("Prêt reçu:", ethers.formatEther(balance)); // Devrait être 0,30

// 4. Simuler quelques jours
for(let day = 1; day <= 5; day++) {
  await onboarding.executeDailySwap(testWallet.address);
  console.log(`Jour ${day} terminé`);
}

// 5. Vérifier les paliers
const status = await onboarding.getUserOnboardingStatus(testWallet.address);
console.log("Palier actuel:", status.currentPalier);
```

---

## 🚨 Plan de Contingence

### Scénarios d'Urgence
1. **Bug critique** : Pause immédiate + rollback
2. **Fonds insuffisants** : Alimentation d'urgence
3. **Attaque** : Désactivation temporaire
4. **Perte de clés** : Procédures de récupération

### Contacts d'Urgence
- **Développeur** : [Votre email]
- **Support** : [Email support]
- **Investisseurs** : [Email investisseurs]

---

## 📈 Optimisations et Améliorations

### Gas Optimizations
```solidity
// Optimisations appliquées
- Utilisation de calldata au lieu de memory
- Packing des variables de stockage
- Fonctions view pour lectures externes
- Événements optimisés
```

### Améliorations Futures
- [ ] Batch processing pour swaps multiples
- [ ] Optimisations gas supplémentaires
- [ ] Interface d'administration
- [ ] Analytics temps réel

---

## 🎯 Critères de Succès

### Tests Validés
- [ ] ✅ 100 utilisateurs test onboardés
- [ ] ✅ 95% des transactions réussies
- [ ] ✅ Temps de réponse < 30 secondes
- [ ] ✅ Coûts gas < 0.01 BNB/utilisateur

### Métriques Métier
- [ ] ✅ Processus en 1 clic confirmé
- [ ] ✅ 30 jours automatiques validés
- [ ] ✅ Remboursement progressif fonctionnel
- [ ] ✅ Utilisateur conserve ses CVTC

---

## 📞 Support et Documentation

### Ressources Disponibles
- **Dossiers d'audit** : `smart-contracts/audit/`
- **Scripts de déploiement** : `smart-contracts/scripts/`
- **Documentation métier** : `README.md`, `CGU-Onboarding-CVTC.md`
- **Tests** : `smart-contracts/scripts/test-*.ts`

### Prochaines Étapes
1. **Audit sécurité** (recommandé avant mainnet)
2. **Tests utilisateurs réels**
3. **Optimisations finales**
4. **Déploiement mainnet**

---

## ✅ Validation Finale

**Avant de considérer le déploiement réussi :**
- [ ] Tous les tests passent sur testnet
- [ ] Documentation complète disponible
- [ ] Plan de monitoring opérationnel
- [ ] Équipe support prête
- [ ] Budget confirmé

**État actuel :** 🟡 Prêt pour déploiement testnet

---

*Guide créé pour faciliter votre déploiement BSC Testnet*
*Date : [Date du jour]*
*Version : 1.0*