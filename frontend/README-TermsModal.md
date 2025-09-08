# Modal des Conditions d'Utilisation Obligatoire

## Vue d'ensemble

Le système de conditions d'utilisation obligatoire a été implémenté pour s'assurer que tous les utilisateurs d'Ocean Bleu acceptent explicitement les termes et conditions avant d'accéder à la plateforme.

## Fonctionnalités

### ✅ Accès Contrôlé
- **Modal obligatoire** : Affiché automatiquement lors du premier accès au Dashboard
- **Blocage complet** : Aucun accès au contenu tant que les conditions ne sont pas acceptées
- **Persistance** : État sauvegardé dans le localStorage

### ✅ Conditions Détaillées
- **Termes complets** : Présentation détaillée des conditions d'utilisation
- **Programme d'onboarding** : Explication du système de swaps automatisés
- **Risques et responsabilités** : Information claire sur les risques Web3

### ✅ Gestion des Refus
- **Redirection automatique** : Vers la page de login en cas de refus
- **Nettoyage des données** : Suppression des statuts d'acceptation
- **Déconnexion propre** : Gestion sécurisée de la session

## Architecture

### Composants

#### `TermsModal.jsx`
```javascript
// Modal principal des conditions d'utilisation
- Interface utilisateur complète avec scroll
- Boutons d'acceptation/refus
- Design responsive et accessible
```

#### `DashboardPage.jsx` - Modifications
```javascript
// Logique de contrôle d'accès
- Vérification des conditions au montage
- Affichage conditionnel du contenu
- Gestion des états d'acceptation
```

### Flux Utilisateur

```
1. Arrivée sur Dashboard
   ↓
2. Vérification localStorage
   ↓
3. Conditions NON acceptées ?
   ├─ OUI → Afficher TermsModal (bloquant)
   └─ NON → Accès au contenu normal
       ↓
   4. Utilisateur accepte/refuse
      ├─ Accepte → Accès débloqué
      └─ Refuse → Redirection login + nettoyage
```

## Configuration

### Variables LocalStorage

```javascript
// État des conditions
localStorage.getItem('termsAccepted') // 'true' | null

// Fonctions utilitaires
getTermsStatus()  // Vérifie l'acceptation
setTermsStatus(bool)  // Définit l'état
```

### États du Composant

```javascript
const [showTermsModal, setShowTermsModal] = useState(false);
const [termsAccepted, setTermsAccepted] = useState(false);
```

## Sécurité

### ✅ Mesures Implémentées
- **Vérification côté client** : Contrôle obligatoire avant rendu
- **Persistance sécurisée** : Utilisation du localStorage
- **Nettoyage automatique** : Suppression des données en cas de refus
- **Navigation contrôlée** : Redirection forcée si nécessaire

### ✅ Gestion des Erreurs
- **Fallback UI** : Écran de chargement pendant la vérification
- **Gestion d'état** : Prévention des états inconsistants
- **Logging complet** : Traçabilité des actions utilisateur

## Utilisation

### Pour les Développeurs

#### Ajouter de Nouvelles Conditions
1. Modifier `TermsModal.jsx` pour ajouter du contenu
2. Mettre à jour les gestionnaires dans `DashboardPage.jsx`
3. Tester le flux complet d'acceptation/refus

#### Personnaliser l'Apparence
```css
/* Variables CSS disponibles */
--accent-color: #your-color;
--text-primary: #your-color;
--card-bg: #your-color;
```

### Pour les Utilisateurs

#### Première Visite
1. Connexion à Ocean Bleu
2. Accès automatique au modal des conditions
3. Lecture obligatoire des termes
4. Choix : Accepter ou Refuser

#### Visites Suivantes
- Accès direct si conditions déjà acceptées
- Possibilité de consulter les conditions via les paramètres

## Maintenance

### Tâches Régulières
- **Mise à jour des conditions** : Notification des utilisateurs des changements
- **Audit de sécurité** : Vérification périodique du système
- **Tests d'intégration** : Validation des flux d'acceptation

### Métriques à Surveiller
- **Taux d'acceptation** : Pourcentage d'utilisateurs acceptant les conditions
- **Temps de lecture** : Durée moyenne passée sur le modal
- **Taux de refus** : Utilisateurs refusant les conditions

## Dépannage

### Problèmes Courants

#### Modal ne s'affiche pas
```javascript
// Vérifier le localStorage
console.log(localStorage.getItem('termsAccepted'));

// Forcer l'affichage pour les tests
localStorage.removeItem('termsAccepted');
```

#### État incohérent
```javascript
// Nettoyer complètement
localStorage.clear();
window.location.reload();
```

#### Redirection en boucle
- Vérifier que `navigate('/login')` fonctionne correctement
- Contrôler les guards de route dans le routeur

## Évolutions Futures

### ✅ Améliorations Prévues
- **Historique des versions** : Tracking des changements de conditions
- **Consentement granulaire** : Acceptation par section
- **Notifications de mise à jour** : Alerte lors de modifications
- **Analytics avancés** : Métriques détaillées d'utilisation

### ✅ Intégrations Possibles
- **Base de données** : Sauvegarde côté serveur des consentements
- **Blockchain** : Enregistrement des consentements sur chaîne
- **Multi-langues** : Support de plusieurs langues
- **Accessibilité** : Conformité WCAG complète