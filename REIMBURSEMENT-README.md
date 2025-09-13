# Système de Remboursement Paymaster CVTC

## Vue d'ensemble

Le système de remboursement du paymaster CVTC implémente une logique de remboursement automatique avec priorité CVTC et fallback BNB, incluant un système de dette (ardoise) pour les utilisateurs fidèles.

## Fonctionnalités principales

### 1. Remboursement Prioritaire
- **CVTC en priorité** : Le système tente d'abord de rembourser avec des tokens CVTC
- **BNB en fallback** : Si CVTC insuffisant, utilise BNB comme alternative
- **Dette (Ardoise)** : Si aucun des deux n'est disponible, crée une dette récupérable

### 2. Système de Dette
- Suivi automatique des montants dus aux utilisateurs
- Marquage des utilisateurs comme "actifs" quand ils ont une dette
- Historique des mises à jour de dette

### 3. Vérification Automatique
- Service backend qui vérifie régulièrement les remboursements possibles
- Traitement par batch pour optimiser les performances
- Intervalle configurable (par défaut: 1 heure)

### 4. Non-bloquant
- Les utilisateurs peuvent continuer à utiliser le système même en cas de dette
- Remboursements traités en arrière-plan
- Pas d'interruption du service utilisateur

## Architecture

### Smart Contract (`CVTCPaymaster.sol`)

#### Nouvelles structures
```solidity
struct UserDebt {
    uint256 cvtcOwed;      // CVTC dû à l'utilisateur
    uint256 bnbOwed;       // BNB dû à l'utilisateur
    uint256 lastUpdate;    // Dernière mise à jour
    bool isActive;         // Dette active
}
```

#### Nouvelles fonctions
- `_processReimbursement()` : Logique de remboursement principale
- `checkAndProcessReimbursement()` : Vérification manuelle
- `batchProcessReimbursements()` : Traitement par batch
- `getUserDebt()` : Consultation des dettes
- `manualReimbursement()` : Remboursement manuel (owner)

### Backend Service (`reimbursementService.js`)

#### Fonctionnalités
- Vérification automatique toutes les heures
- Traitement par batch des utilisateurs
- Intégration avec le fichier de données utilisateurs
- Logging détaillé des opérations

#### Configuration
```javascript
const config = {
    checkInterval: 60 * 60 * 1000, // 1 heure
    maxBatchSize: 50,              // 50 utilisateurs par batch
    reimbursementCheckInterval: 3600 // 1 heure en secondes
};
```

### API Routes

#### Nouvelles routes paymaster
- `GET /api/paymaster/debt/:userAddress` : Consulter la dette d'un utilisateur
- `POST /api/paymaster/reimbursement/:userAddress` : Déclencher remboursement
- `POST /api/paymaster/batch-reimbursement` : Remboursement par batch
- `GET /api/paymaster/reimbursement-status` : Statut du système

## Flux de remboursement

### 1. Transaction utilisateur
```
Utilisateur effectue une transaction ERC-4337
    ↓
Paymaster valide et exécute
    ↓
postOp() est appelé
    ↓
_processReimbursement() tente :
    1. Remboursement CVTC (priorité)
    2. Remboursement BNB (fallback)
    3. Création de dette (si insuffisant)
```

### 2. Vérification périodique
```
Service backend (toutes les heures)
    ↓
Parcourt tous les utilisateurs
    ↓
Vérifie les dettes actives
    ↓
Traite par batch de 50 utilisateurs
    ↓
Tente remboursement automatique
```

## Déploiement

### 1. Mise à jour du contrat
```bash
# Compiler le nouveau contrat
npx hardhat compile

# Déployer avec la nouvelle adresse CVTC Swap
npx hardhat run scripts/deploy-pimlico-paymaster.ts --network bsc-testnet
```

### 2. Configuration
Mettre à jour `smart-contracts/scripts/deploy-pimlico-paymaster.ts` :
```typescript
const CVTC_SWAP_ADDRESS = "0xVotreAdresseCVTCSwapContract";
```

### 3. Backend
Le service de remboursement se lance automatiquement avec le serveur :
```javascript
// Dans server.js
const reimbursementService = getReimbursementService();
reimbursementService.start();
```

## Tests

### Script de test
```bash
npx hardhat run scripts/test-reimbursement.ts --network bsc-testnet
```

### Tests couverts
- ✅ Connexion au paymaster
- ✅ Vérification tokens supportés
- ✅ Simulation de dette
- ✅ Remboursement individuel
- ✅ Remboursement par batch
- ✅ Calcul des quotes
- ✅ Génération données paymaster

## Sécurité

### Mesures de protection
- **OnlyOwner** : Fonctions de remboursement manuel réservées au propriétaire
- **Validation** : Vérification des adresses et montants
- **Rate limiting** : Intervalle minimum entre vérifications
- **Batch processing** : Limitation à 50 utilisateurs par batch

### Gestion des erreurs
- Remboursements qui échouent ne bloquent pas le système
- Logging détaillé pour debugging
- Rollback automatique en cas d'erreur

## Monitoring

### Métriques à surveiller
- Nombre d'utilisateurs avec dette active
- Montant total des dettes (CVTC + BNB)
- Taux de succès des remboursements
- Fréquence des vérifications

### Logs importants
```
✅ [REIMBURSEMENT] Remboursement traité pour 0x123... - TX: 0xabc...
✅ [REIMBURSEMENT] Batch 5/10 traité - TX: 0xdef...
⚠️ [REIMBURSEMENT] Aucun utilisateur avec dette trouvé
```

## Utilisation pour les utilisateurs

### Vérifier sa dette
```javascript
// Via API
GET /api/paymaster/debt/0xUtilisateurAddress
```

### Remboursement manuel (admin)
```javascript
// Via API
POST /api/paymaster/reimbursement/0xUtilisateurAddress
```

## Avantages du système

### Pour les utilisateurs
- **Transparence** : Visibilité totale des dettes
- **Confiance** : Remboursement automatique garanti
- **Continuité** : Service non interrompu

### Pour le système
- **Évolutivité** : Traitement par batch
- **Efficacité** : Vérification périodique automatisée
- **Fiabilité** : Mécanismes de fallback

## Évolutions futures

### Améliorations possibles
- Interface frontend pour consulter les dettes
- Notifications push lors des remboursements
- Analytics avancés sur les dettes
- Intégration avec d'autres tokens
- Optimisation des gas fees pour les remboursements

---

*Ce système garantit que les utilisateurs fidèles peuvent toujours utiliser le service CVTC, même en cas de fonds temporairement insuffisants, tout en assurant une récupération automatique des montants avancés.*