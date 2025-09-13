# 🚀 PROTOCOLE DE VALIDATION RIGOUREUSE - CVTC OCEAN BLEU

## 📋 **RÉSUMÉ RAPIDE**
**Objectif** : Prévenir tout déploiement sur BSC tant que la suite automatique de tests et vérifications n'est pas entièrement validée.

**Priorité** : Binance Smart Chain (BSC Testnet → BSC Mainnet)

**Moyens** : CI obligatoire + tests unitaires/intégration + fuzzing + linters + analyse statique + vérification BscScan

---

## ✅ **CHECKLIST CONDENSÉE** (à cocher par l'agent)

### 🔧 **Compilation & Code Quality**
- [ ] Code compile sans warnings avec solc (version verrouillée : `^0.8.24`)
- [ ] Linter (solhint + prettier) - OK
- [ ] Static analysis (slither) - aucun high/critical trouvé
- [ ] Gas estimation raisonnable (< 5M pour fonctions critiques)

### 🧪 **Tests & Coverage**
- [ ] Tests unitaires passent (100% requis pour fonctions critiques)
- [ ] Tests d'intégration (scénarios réels) - OK
- [ ] Fuzzing / property-based tests exécutés - OK
- [ ] Coverage ≥ 85% global, 95% pour core functions

### 🌐 **Déploiement & Vérification**
- [ ] Simulation de déploiement (fork BSC testnet) - OK
- [ ] Vérification automatisée sur BscScan Testnet - OK
- [ ] Bytecode hash vérifié et réconcilié
- [ ] Tests post-déploiement (smoke tests) - OK

### 🔐 **Sécurité & Audit**
- [ ] Audit de sécurité (optionnel mais recommandé)
- [ ] Revue de code par pair
- [ ] Multi-sig pour déploiements sensibles
- [ ] Plan de récupération d'urgence

### 🚫 **RÈGLE ABSOLUE**
- [ ] **AUCUNE ACTION** `deploy --network bsc` vers mainnet tant que la checklist n'est pas entièrement ✅
- [ ] **DÉPLOIEMENT MAINNET UNIQUEMENT MANUEL** après validation CI complète

---

## 🔄 **PROCÉDURE AUTOMATIQUE PAS-À-PAS** (workflow CI)

### 1️⃣ **Préparation & Verrouillage**
```bash
# Verrouiller la version du compilateur
pragma solidity ^0.8.24;

# Configuration Hardhat
solidity: {
  version: "0.8.24",
  settings: {
    optimizer: { enabled: true, runs: 200 }
  }
}
```

### 2️⃣ **Lint & Format**
```bash
# Vérification du format
npx prettier --check "contracts/**/*.sol"
npx solhint 'contracts/**/*.sol'

# Correction automatique si possible
npx prettier --write "contracts/**/*.sol"
```

### 3️⃣ **Compilation Stricte**
```bash
# Compilation avec échec sur warning
npx hardhat compile --force

# Vérifier absence de warnings
# ÉCHEC SI WARNINGS PRÉSENTS
```

### 4️⃣ **Tests Unitaires**
```bash
# Tests avec mocks pour dépendances externes
npx hardhat test

# Rapports de couverture
npx hardhat coverage

# ÉCHEC SI < 85% COVERAGE GLOBAL
# ÉCHEC SI < 95% POUR FONCTIONS CRITIQUES
```

### 5️⃣ **Tests d'Intégration**
```bash
# Tests de scénarios réels
npx hardhat test --grep "integration"

# Tests d'interactions entre contrats
# Tests de flux complets (onboarding → swap)
```

### 6️⃣ **Fuzzing & Property-Based Tests**
```bash
# Avec Foundry si disponible
forge test --fuzz

# Invariants à tester :
# - Conservation du total supply
# - Pas d'overflow/underflow
# - Accès owner-only respecté
# - Balances cohérentes après swaps
```

### 7️⃣ **Analyse Statique**
```bash
# Slither pour analyse de sécurité
slither . --checklist

# ÉCHEC SI HIGH/CRITICAL FINDINGS
# WARNINGS DOIVENT ÊTRE REVUS
```

### 8️⃣ **Simulation de Déploiement**
```bash
# Fork BSC testnet local
npx hardhat node --fork https://data-seed-prebsc-1-s1.binance.org:8545/

# Déployer et tester sur fork
npx hardhat run scripts/deploy-and-test.ts --network localhost
```

### 9️⃣ **Gas Profiling & Optimisation**
```bash
# Rapport de gaz
npx hardhat run scripts/gas-report.ts

# Vérifier limites :
# - Déploiement < 10M gas
# - Fonctions critiques < 5M gas
# - Transactions normales < 2M gas
```

### 🔟 **Vérification BscScan Testnet**
```bash
# Vérifier le contrat déployé
npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# Vérifier bytecode match
# Comparer hash bytecode local vs on-chain
```

---

## 🤖 **PROMPT STRICT POUR L'AGENT (FR)**

```
AGENT PROMPT — PROTOCOLE DE VALIDATION SOLIDITY (STRICT, FR)

Tu es un agent d'automatisation CI pour CVTC Ocean Bleu.
Ton objectif : VALIDER et TESTER entièrement les contrats avant déploiement sur BSC.

RÈGLES STRICTES :
- EXIT CODE NON-NULL si échec d'une étape
- JAMAIS déployer sur mainnet automatiquement
- PRODUIRE logs clairs + artefacts à chaque exécution
- RESPECTER l'ordre des étapes
- ÉCHEC sur tout warning en mode strict

ÉTAPES À EXÉCUTER :

1. Verrouiller solc version (^0.8.24)
2. Linter (prettier + solhint) - corriger auto ou échouer
3. Compiler (optimisation ON) - échec sur warnings
4. Tests unitaires (mocks externes) - 100% pour critiques
5. Tests intégration (scénarios réels)
6. Fuzzing (invariants : supply, overflow, owner)
7. Static analysis (slither) - échec si high/critical
8. Coverage (≥85% global, 95% core)
9. Simulation déploiement (fork BSC testnet)
10. Gas profiling (limites définies)
11. Vérification BscScan testnet
12. Double-check bytecode hash

SORTIE : Artefacts (flattened.sol, bytecode hash, rapports tests/coverage/slither)
```

---

## 🚨 **PROCÉDURES D'URGENCE**

### **En cas d'échec de validation :**
1. **Ne pas déployer** - corriger les problèmes d'abord
2. **Revue de code** obligatoire
3. **Tests supplémentaires** si nécessaire
4. **Re-validation complète** avant retry

### **En cas de déploiement accidentel :**
1. **Pause immédiate** du contrat si possible
2. **Audit de sécurité** prioritaire
3. **Communication** avec utilisateurs
4. **Plan de récupération** activé

---

## 📊 **MÉTRIQUES DE SUCCÈS**

- ✅ **Compilation** : 0 warnings
- ✅ **Tests** : 100% pass + coverage ≥85%
- ✅ **Sécurité** : 0 high/critical findings
- ✅ **Performance** : Gas < limites définies
- ✅ **Vérification** : Bytecode match parfait

---

**🔒 Ce protocole garantit la qualité et la sécurité des déploiements CVTC Ocean Bleu**</content>
</xai:function_call/>
</xai:function_call name="read">
<parameter name="filePath">/Users/utilisateur/Documents/GitHub/CVTC-Ocean-Bleu/PROTOCOLE-VALIDATION.md