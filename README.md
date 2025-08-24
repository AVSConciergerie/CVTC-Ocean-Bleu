# CVTC: Ocean Bleu

## Description
Plateforme d'exploration sécurisée pour CVTC et le Web3, offrant une passerelle vers l'économie décentralisée.

## Architecture
Ce projet est une application full-stack composée d'un backend Node.js et d'un frontend React/Vite.

[... Contenu existant ...]

---

## Point d'Étape et Journal de Session (18/08/2025)

Cette section documente la session de travail intensive axée sur la refonte de l'interface et la résolution de bugs critiques.

### Résumé des Avancées

1.  **Refonte du `DashboardPage`**
    *   Remplacement de la sidebar simple par un composant `Sidebar` avancé, rétractable, et modulaire, créé de A à Z.
    *   Mise en place d'une nouvelle structure de layout "Titre puis Colonnes" pour une meilleure intégration visuelle.
    *   Amélioration de la lisibilité des tableaux de données avec troncature des adresses et fonctionnalité de copie dans le presse-papiers.

2.  **Mise en Place d'un Système de Thèmes Global**
    *   Création d'un `ThemeContext` React pour gérer un état global `light` (Lagon) / `dark` (Abyss).
    *   Refonte complète du fichier `index.css` pour utiliser un système de variables CSS, permettant un changement de thème sur toute l'application.
    *   Le `DashboardPage` et l'arrière-plan animé `AuroraBackground` sont maintenant connectés à ce système et réagissent au changement de thème.

### Résumé du Débogage

Plusieurs bugs critiques et complexes ont été identifiés et résolus :

1.  **Bug des "Deux Dashboards"**
    *   **Symptôme :** Selon la méthode de connexion, l'utilisateur était redirigé vers l'ancien `dashboard.html` ou le nouveau `DashboardPage.jsx`.
    *   **Cause Racine :** La page d'accueil principale (`HomePage.jsx`) ne vérifiait pas si l'utilisateur était déjà authentifié via Privy, ce qui provoquait une redirection par défaut de Privy vers l'ancienne page.
    *   **Solution :** Implémentation de la logique de vérification d'authentification sur `HomePage.jsx` pour rediriger systématiquement vers `/dashboard`.

2.  **Bug de Rechargement de Page (CTRL+R)**
    *   **Symptôme :** Recharger la page sur une URL comme `/dashboard` affichait l'ancien fichier `dashboard.html`.
    *   **Cause Racine :** La présence de fichiers HTML statiques (`dashboard.html`, `wallet.html`, etc.) à la racine du projet créait un conflit avec le serveur de développement Vite, qui leur donnait la priorité sur l'application React.
    *   **Solution :** Suppression des fichiers HTML statiques conflictuels.

3.  **Bug de Mise en Page "Côte à Côte"**
    *   **Symptôme :** Les éléments utilisant des classes `flex-row` (comme la sidebar et le contenu principal) s'affichaient les uns sur les autres, et non côte à côte.
    *   **Cause Racine Identifiée :** Après une longue série de tests (y compris l'isolation des composants et l'application de styles en ligne), il a été découvert que le projet **n'a jamais été configuré pour utiliser TailwindCSS**. Les classes utilitaires (`flex`, `flex-row`, `p-8`, etc.) étaient présentes dans le code JSX mais n'avaient aucun effet car elles n'étaient pas traduites en CSS.
    *   **Analyse :** Ce problème est la cause sous-jacente de toutes les difficultés de mise en page rencontrées durant la session.

### Prochaines Étapes Claires

1.  **Priorité Absolue :** Installer et configurer **TailwindCSS** dans le projet `frontend`. C'est l'étape indispensable pour que tout le design et la mise en page que nous avons construits puissent enfin s'afficher correctement.
2.  **Validation :** Vérifier que la mise en page du `DashboardPage` est fonctionnelle une fois Tailwind activé.
3.  **Nettoyage :** Retirer les classes de débogage (bordures de couleur) du code.

---

## Point d'Étape et Journal de Session (19/08/2025)

Cette session a été consacrée à la résolution du problème de fond identifié précédemment : l'absence de TailwindCSS.

### Résumé des Actions

1.  **Diagnostic d'un Problème d'Installation :**
    *   Les tentatives initiales d'initialisation de Tailwind (`npx tailwindcss init`) ont échoué car l'exécutable était introuvable.
    *   Une investigation plus poussée (vérification de `node_modules/.bin`, `package.json`, et `npm view tailwindcss`) a révélé que la version 4 de TailwindCSS ne fournit plus d'exécutable via le paquet principal, ce qui représente un changement majeur par rapport aux versions précédentes.

2.  **Recherche et Implémentation de la Nouvelle Méthode (Tailwind v4) :**
    *   Une recherche a permis d'identifier la nouvelle procédure d'installation pour les projets Vite, qui repose sur un nouveau plugin dédié : `@tailwindcss/vite`.
    *   Les anciennes dépendances (`postcss`, `autoprefixer`) ont été nettoyées.
    *   Les nouveaux paquets (`tailwindcss`, `@tailwindcss/vite`) ont été installés.
    *   Le fichier de configuration `vite.config.js` a été mis à jour pour utiliser le nouveau plugin.
    *   Le fichier `src/index.css` a été modifié pour importer les styles de Tailwind tout en préservant le système de thèmes personnalisé (Lagon/Abyss).

3.  **Validation et Nettoyage :**
    *   Le serveur de développement a été lancé, et la mise en page du `DashboardPage` a été confirmée comme étant fonctionnelle (les éléments s'affichent désormais côte à côte).
    *   Les classes de débogage (`.debug-red`, etc.) et les styles en ligne de test ont été supprimés des fichiers `index.css` et `DashboardPage.jsx`.

### État du Projet

Le projet est maintenant sur une base technique saine. TailwindCSS est correctement installé et fonctionnel, débloquant ainsi la poursuite du développement de l'interface utilisateur.

---

## Point d'Étape et Journal de Session (20/08/2025)

Cette session a été axée sur la construction de l'interface utilisateur principale, la résolution de bugs critiques et l'ajout de fonctionnalités clés.

### Résumé des Avancées

1.  **Interface Utilisateur (UI) & Expérience (UX) :**
    *   **Sidebar Fonctionnelle :** La barre latérale a été entièrement reconstruite pour inclure la navigation réelle entre les pages (Home, Fonctionnalités, Information) via `react-router-dom`.
    *   **Sélecteur de Thème :** Le bouton "Mode" est maintenant fonctionnel et permet de basculer entre les thèmes "Lagon" (clair) et "Abyss" (sombre) sur toute l'application.
    *   **Affichage du Portefeuille :** Le profil utilisateur affiche désormais l'adresse du portefeuille connecté via Privy, avec des fonctionnalités de troncature et de copie.
    *   **Déconnexion :** Le bouton de déconnexion est fonctionnel, mettant fin à la session Privy et redirigeant vers la page d'accueil.
    *   **Améliorations Visuelles :** Ajout d'effets de survol (zoom et lueur) sur les icônes de la barre latérale et affinage de la typographie (effets de halo et d'ombre) pour correspondre aux directives de design.

2.  **Nouvelles Fonctionnalités :**
    *   **Page de Transfert P2P :** Création d'une page dédiée (`/p2p-transfer`) avec un formulaire détaillé permettant d'ajouter des destinataires, de spécifier un montant, de choisir une fréquence et de voir un résumé dynamique du transfert.
    *   **Flux d'Onboarding Utilisateur :** Mise en place d'un pop-up modal pour les nouveaux utilisateurs, qui se déclenche après la création du portefeuille. Le pop-up présente les conditions et ne disparaît de façon permanente qu'après acceptation.
    *   **Composant `FeatureCard` :** Création d'une carte réutilisable avec un effet de bordure néon animée pour présenter les fonctionnalités principales.

3.  **Résolution de Bugs Critiques :**
    *   **Bug de la Page Blanche :** Le bug le plus persistant, qui rendait la page d'accueil blanche après la déconnexion, a été diagnostiqué et résolu. La cause était un conflit de rendu du composant `<AuroraBackground>` qui était appelé à la fois dans `App.jsx` et `HomePage.jsx`.
    *   **Problème de Taille du Logo :** La taille démesurée du logo sur les pages d'accueil et de connexion a été corrigée en créant une règle de style globale.

### État du Projet

L'application est maintenant beaucoup plus robuste et fonctionnelle. Le socle de l'interface utilisateur est en place, les principaux bugs sont résolus, et des fonctionnalités clés ont été implémentées, nous rapprochant d'une version alpha utilisable.

---

## Journal de Développement - Session du 20/08/2025

### Objectif : Mise en place d'un environnement de développement Hardhat

Mise en place d'un environnement de développement local pour les smart contracts avec Hardhat afin de remplacer Remix IDE et de permettre la sauvegarde et la gestion de version des contrats.

**Difficultés rencontrées :**

1.  **Incompatibilité avec Hardhat v3 :** La dernière version de Hardhat (v3) et sa configuration moderne (ESM, `"type": "module"`) ont provoqué de nombreuses erreurs de compatibilité avec l'écosystème de plugins (`hardhat-toolbox`, `chai`, etc.), rendant l'environnement instable.
2.  **Erreur de sécurité :** Lors de la configuration du déploiement, une clé privée a été accidentellement exposée dans les logs de commande.

**Solutions et décisions :**

1.  **Rétrogradation vers Hardhat v2 :** Pour garantir la stabilité, nous avons abandonné Hardhat v3 et sommes revenus à une configuration stable et éprouvée avec **Hardhat v2.19.0** et la **`toolbox` v2.0.0**. Cela a résolu tous les problèmes de dépendances.
2.  **Nouvelle procédure de sécurité :** Pour éviter toute nouvelle fuite de données sensibles, une nouvelle politique a été adoptée : les fichiers contenant des secrets (comme `.env`) ne seront plus jamais lus ni écrits directement par l'assistant. Les ajouts se feront via des commandes sécurisées et les modifications complexes seront effectuées manuellement par l'utilisateur sur la base d'instructions claires.

### Objectif : Déploiement sur BSC Testnet

Configuration du projet pour déployer et vérifier des contrats sur le Testnet de la Binance Smart Chain.

**Actions réalisées :**

1.  **Configuration de `hardhat.config.ts` :** Ajout du réseau `bscTestnet` et de la configuration `etherscan` pour la vérification.
2.  **Gestion des secrets :** Utilisation d'un fichier `.env` pour stocker la `PRIVATE_KEY` et la `BSCSCAN_API_KEY`.
3.  **Déploiement :** Le contrat `Lock.sol` a été déployé avec succès sur le BSC Testnet.
4.  **Vérification du contrat :** Le processus de vérification est **en pause**. Un problème de connexion au compte BscScan/Etherscan empêche l'obtention de la clé API nécessaire. Cette étape sera reprise ultérieurement.

**Statut :** L'environnement de développement est fonctionnel et le déploiement sur un réseau public est validé.

---

## Journal de Développement - Session du 21/08/2025

### Objectif : Intégration de Biconomy Paymaster

Lancement des travaux pour intégrer Biconomy afin de permettre des transactions sans frais de gaz ("gasless") pour les utilisateurs.

**Actions réalisées :**

1.  **Clarification de l'objectif :** Il a été confirmé que le but est bien de sponsoriser les frais de transaction des utilisateurs via un Paymaster, en particulier pour les actions liées au token CVTC et aux modules du dashboard.

2.  **Configuration Biconomy :** L'utilisateur a créé un projet sur le dashboard de Biconomy pour le réseau **BSC Testnet** et a récupéré les deux URLs nécessaires au fonctionnement (Bundler et Paymaster).
    *   Ces URLs ont été stockées de manière sécurisée dans le fichier `.env`.

3.  **Installation du SDK Biconomy :**
    *   Une première tentative d'installation a révélé que le paquet `@biconomy/smart-account` était obsolète (déprécié).
    *   Après recherche, le paquet obsolète a été désinstallé et remplacé par la nouvelle suite de paquets modulaires et à jour : `@biconomy/account`, `@biconomy/paymaster`, `@biconomy/bundler`, et `@biconomy/common`.
    *   Le projet `frontend` est maintenant sur une base technique saine pour commencer l'intégration.

**Prochaines Étapes Claires :**

1.  Créer un service `biconomyService.js` dans le dossier `frontend/src/services`.
2.  Implémenter la logique d'initialisation du "Smart Account" Biconomy dans ce service.
3.  Intégrer le service dans le `DashboardPage.jsx` pour connecter l'utilisateur à Biconomy.
4.  Ajouter une transaction de test pour valider l'intégration de bout en bout.

---

## Journal de Développement - Session du 21/08/2025 (Partie 2) & Pivot Stratégique

### Objectif : Finaliser l'intégration de Biconomy

Cette session visait à finaliser et tester l'intégration de Biconomy Paymaster.

**Actions réalisées :**

1.  **Création d'un script de test :** Un script Node.js (`test-biconomy.js`) a été créé dans le `backend` pour tester la chaîne de sponsoring de Biconomy de manière isolée, sans dépendre de l'interface utilisateur.
2.  **Tests et Débogage :** Le script a permis de confirmer que la configuration locale (clés API, etc.) était correcte et que la communication avec les services Biconomy était établie.
3.  **Identification du Problème Final :** Le script a échoué avec une erreur `520` provenant directement du Paymaster de Biconomy, indiquant un refus de sponsoriser la transaction. La cause la plus probable est un manque de fonds sur le Paymaster sur le tableau de bord de Biconomy.

**Blocage et Décision de Pivot :**

1.  **Plateforme Biconomy Inaccessible :** Au moment de vouloir recharger le Paymaster, la plateforme Biconomy est devenue instable, affichant une erreur "Error fetching projects" qui a empêché toute action.
2.  **Confirmation de l'Instabilité :** Une recherche a révélé plusieurs rapports d'incidents et de pannes récents sur les services de Biconomy.
3.  **Décision Stratégique :** Face à l'instabilité avérée de la plateforme Biconomy, et pour ne pas risquer la fiabilité du projet, la décision a été prise d'abandonner Biconomy et de migrer vers un fournisseur d'infrastructure plus stable.

### Objectif : Sélection d'un nouveau fournisseur d'Abstraction de Compte

**Actions réalisées :**

1.  **Recherche de Marché :** Une analyse des concurrents a été menée, évaluant Alchemy, Pimlico, ZeroDev, et Stackup sur des critères de stabilité, de réputation et de facilité d'intégration.
2.  **Recommandation et Choix :** **ZeroDev** a été sélectionné comme le meilleur remplaçant. Ce choix est motivé par deux facteurs clés :
    *   **Stabilité et Viabilité :** ZeroDev a été racheté par Offchain Labs (l'équipe derrière Arbitrum), ce qui garantit un soutien solide.
    *   **Synergie d'Écosystème :** ZeroDev a un partenariat officiel avec **Privy**, notre fournisseur de portefeuille, ce qui devrait grandement simplifier l'intégration technique.

**Prochaines Étapes Claires :**

1.  **Sauvegarde :** Le projet actuel sera sauvegardé dans un dossier `CVTC-Ocean-Bleu_Biconomy-Backup`.
2.  **Redémarrage :** L'utilisateur va redémarrer son ordinateur pour résoudre les problèmes d'environnement local (cache, etc.).
3.  **Nouvelle Intégration :** Au redémarrage, nous commencerons l'intégration de **ZeroDev** dans le projet principal.

---

## Journal de Développement - Session du 22/08/2025

### Objectif : Standardisation des Composants d'Interface

Afin d'accélérer le développement et de garantir une cohérence visuelle, un standard pour les composants de type "carte" a été défini.

**Actions réalisées :**

1.  **Analyse de l'Existant :** Le composant `P2PTransferPage.jsx` a été analysé pour servir de référence en matière de style et de structure.
2.  **Création d'un Prompt Modèle :** Un prompt détaillé a été rédigé pour guider la génération de nouvelles cartes par l'IA. Ce prompt inclut les règles de style (classes Tailwind), la structure JSX et les variables CSS à utiliser.
3.  **Sauvegarde du Modèle :** Le prompt a été sauvegardé dans le fichier `prompt_card_template.txt` à la racine du projet, pour une réutilisation facile.

**Statut :** Le projet dispose maintenant d'un processus clair pour la création de nouveaux composants d'interface, assurant une meilleure maintenabilité et une expérience utilisateur cohérente.

---

## Journal de Développement - Session du 22/08/2025 (Partie 2)

### Objectif : Mise en place d'une infrastructure d'abstraction de compte auto-hébergée

Suite à une analyse approfondie des modèles économiques des fournisseurs de services d'abstraction de compte, une décision stratégique a été prise pour garantir une indépendance et une maîtrise des coûts maximales.

**Actions réalisées :**

1.  **Abandon des Solutions Tierces :** Les solutions comme ZeroDev ou Pimlico ont été écartées pour éviter la dépendance à un tiers et les modèles de commission.
2.  **Adoption d'une Stratégie d'Auto-Hébergement :** Le projet s'oriente vers une infrastructure 100% open-source, hébergée et contrôlée en interne.
3.  **Installation du Bundler :** Le bundler open-source **Skandha** a été cloné et ses dépendances ont été installées.
4.  **Configuration du Bundler :** Le fichier de configuration de Skandha a été modifié pour cibler le **BSC Testnet**. Une nouvelle clé privée a été générée pour le compte du "relayer".

**Action Requise / Prochaine Étape :**

*   **Financement du Relayer :** Le compte du relayer doit être approvisionné en tBNB (tokens de test du BSC Testnet) pour pouvoir payer les frais de transaction des lots (`bundles`). L'utilisateur s'en charge.
*   **Démarrage du Bundler :** Une fois le compte approvisionné, le bundler pourra être démarré localement pour les premiers tests.

---

## Journal de Développement - Session du 22/08/2025 (Partie 3)

### Objectif : Planification de l'intégration d'un service On/Off-Ramp (Monerium)

Recherche et planification de l'intégration d'une solution pour permettre les virements bancaires (euros) depuis et vers les portefeuilles des utilisateurs.

**Actions réalisées :**

1.  **Analyse du besoin :** Confirmation que l'intégration doit être multi-utilisateurs. Chaque utilisateur de la plateforme doit pouvoir connecter son propre compte Monerium.
2.  **Recherche & Sélection :** Le service **Monerium** a été identifié comme le meilleur candidat, étant un Établissement de Monnaie Électronique (EMI) réglementé en Europe et spécialisé dans la fourniture d'IBAN pour les portefeuilles crypto.
3.  **Analyse de l'Expérience Utilisateur (UX) :** Il a été confirmé que, dû aux obligations réglementaires (KYC/AML), un nouvel utilisateur devra être redirigé vers le site de Monerium pour créer un compte et compléter une vérification d'identité. C'est une étape unique mais nécessaire.
4.  **Analyse Technique :** L'intégration se fera via le protocole standard **OAuth 2.0**. Monerium propose un environnement de test (Sandbox) et un SDK pour faciliter le développement.

**État et Prochaines Étapes :**

Le projet est en pause, en attente de la configuration du compte développeur Monerium par l'utilisateur.

*   **Action Requise par l'Utilisateur (C.) :** Créer un compte sur le portail développeur de **Monerium (Sandbox)**.
*   **Configuration Clé :** Lors de la création de l'application sur le portail Monerium, l'URL de redirection (`Redirect URI`) suivante doit être impérativement utilisée : `http://localhost:5173/auth/monerium/callback`.
*   **Objectif Final :** Récupérer le `client_id` de l'application pour lancer l'intégration technique.
---

## Journal de Développement - Session du 23/08/2025

### Objectif : Configuration de l'application Monerium pour l'intégration OAuth 2.0

Reprise des travaux sur l'intégration du service On/Off-Ramp Monerium.

**Actions réalisées :**

1.  **Création du Compte Développeur :** L'utilisateur a initié la création du compte sur le portail développeur de Monerium (Sandbox).
2.  **Décision Stratégique (KYB) :** Il a été décidé de créer le compte en tant qu'**"Entreprise"**, car "CVTC: Ocean Bleu" agit en tant que plateforme fournissant un service, et non en tant que simple utilisateur personnel.
3.  **Configuration de l'Application OAuth :** Le processus de création d'une nouvelle application a été entamé sur le portail. Les paramètres suivants ont été définis pour l'environnement de développement :
    *   **URL de redirection (Redirect URI) :** `http://localhost:5173/auth/monerium/callback`
    *   **URLs légales :** Des placeholders pour la politique de confidentialité et les conditions d'utilisation ont été définis (`/privacy-policy`, `/terms-of-service`).
4.  **Création des Contenus Légaux (MVP) :** Pour supporter la configuration, des fichiers `privacy-policy.md` et `terms-of-service.md` ont été créés à la racine du projet avec un contenu de base.

**État et Prochaines Étapes :**

*   **Action Requise par l'Utilisateur (C.) :** Valider la création de l'application sur le portail Monerium.
*   **Objectif Final :** Récupérer le **`Client ID`** et le **`Client Secret`** pour pouvoir commencer le développement de l'intégration technique dans le backend.
---

## Journal de Développement - Session du 23/08/2025 (Partie 2)

### Objectif : Implémentation de bout en bout du flux de connexion Monerium

Finalisation de l'implémentation technique pour permettre aux utilisateurs de connecter leur compte Monerium à la plateforme.

**Actions réalisées (Backend) :**

1.  **Modification du Schéma de DB :** Le fichier `database.js` a été mis à jour pour inclure des colonnes dédiées au stockage des informations Monerium (`monerium_profile_id`, `monerium_access_token`, etc.). La base de données a été recréée pour appliquer ces changements.
2.  **Implémentation du Flux OAuth 2.0 :**
    *   Le fichier `routes/monerium.js` a été créé et contient maintenant la logique complète du "Authorization Code Flow with PKCE".
    *   La route `/connect` gère la redirection sécurisée vers Monerium, en incluant un `state` pour la protection CSRF et le suivi de l'utilisateur.
    *   La route `/callback` gère le retour de Monerium, l'échange du code d'autorisation contre un `access_token`, la récupération du profil utilisateur, et le stockage des informations en base de données.
3.  **Mise à jour des Dépendances :** Le paquet `node-fetch` a été ajouté au `backend` pour permettre les appels API serveur-à-serveur.
4.  **Mise à jour du Repository :** La fonction `updateUserMoneriumDetails` a été ajoutée à `userRepository.js` pour gérer l'écriture des nouvelles informations dans la base de données.

**Actions réalisées (Frontend) :**

1.  **Ajout du Point d'Entrée :** Un nouveau composant visuel a été ajouté à la page `DashboardPage.jsx`.
2.  **Bouton de Connexion :** Ce composant inclut un bouton "Connecter avec Monerium" qui redirige l'utilisateur vers la route de connexion du backend (`/api/monerium/connect`), en passant l'adresse de son portefeuille en paramètre.

**Changement de Configuration Requis :**

*   L'URL de redirection (`Redirect URI`) sur le portail développeur de Monerium a dû être modifiée pour pointer vers le backend : `http://localhost:4000/api/monerium/callback`.

**État et Prochaines Étapes :**

*   **Code Terminé :** L'implémentation de la fonctionnalité est terminée.
*   **Action Requise par l'Utilisateur (C.) :**
    1.  Confirmer que l'URL de redirection a bien été mise à jour sur le portail Monerium.
    2.  Redémarrer le serveur backend pour charger toutes les modifications.
    3.  Tester le flux de connexion de bout en bout depuis le tableau de bord.

---

## Journal de Développement - Session du 23/08/2025 (Partie 3)

### Objectif : Résoudre l'incompatibilité de l'environnement Node.js pour démarrer le bundler Skandha

**Problème Identifié :**
Le projet Skandha, tel que conçu, utilise des fonctionnalités de résolution de modules ES (par exemple, l'import de dossiers) qui sont obsolètes ou ont été supprimées dans les versions récentes de Node.js (comme la v22 utilisée actuellement). Cela provoque des erreurs en cascade de type `ERR_UNSUPPORTED_DIR_IMPORT` et `ERR_MODULE_NOT_FOUND`, empêchant le démarrage du bundler. Les tentatives de "patching" manuel du code compilé se sont avérées inefficaces, complexes et risquées pour la stabilité du projet.

**Plan d'Action Stratégique :**
Face à ce blocage, une nouvelle approche a été décidée pour garantir un environnement de développement stable et fonctionnel.

1.  **Consignation :** Documentation du plan d'action dans ce README avant exécution.
2.  **Nettoyage Complet :** Exécution de la commande `yarn clean` à la racine du projet `skandha` pour supprimer tous les dossiers `lib` (code compilé) et `node_modules`. Cette étape est cruciale pour éliminer tout risque de conflit avec d'anciens fichiers.
3.  **Changement d'Environnement :** Utilisation de `nvm` (Node Version Manager) pour passer à **Node.js v18**. Cette version est compatible avec l'architecture du projet Skandha.
4.  **Réinstallation Propre :** Lancement de `yarn install` pour télécharger et installer toutes les dépendances, en s'assurant de leur compatibilité avec Node.js v18.
5.  **Reconstruction Complète :** Lancement de `yarn build` pour recompiler l'intégralité du code source du projet dans l'environnement nouvellement configuré.
6.  **Validation :** Tentative de démarrage du bundler en mode `standalone` pour valider la résolution du problème.

---

## Journal de Développement - Session du 23/08/2025 (Partie 4)

### Objectif : Résoudre le blocage du démarrage du bundler.

**Décision Stratégique (Pivot) :**
Face aux incompatibilités persistantes entre le bundler auto-hébergé Skandha et l'environnement Node.js v22, et pour éviter les risques liés à la modification de l'environnement système (downgrade de Node.js), une décision de pivot a été prise. Le projet abandonne la solution Skandha au profit du **service de bundler hébergé par Pimlico**.

**Justification :**
Cette approche élimine immédiatement tous les problèmes de compatibilité et de dépendances, permettant de se concentrer sur l'intégration fonctionnelle. C'est une étape stratégique pour débloquer le développement, avec la possibilité de revenir à une solution auto-hébergée plus tard.

**Prochaines Étapes :**
1.  **Action Requise par l'Utilisateur (C.) :** Créer un compte sur le dashboard de Pimlico et générer une clé API pour le réseau BSC Testnet.
2.  **Pause et Nettoyage :** Une fois la clé obtenue, une pause sera observée pour nettoyer l'environnement de développement local et éliminer tout "zombie build" potentiel issu des tentatives précédentes.
3.  **Intégration :** Intégrer la clé API de Pimlico dans l'application.

---

## Journal de Développement - Session du 24/08/2025

### Objectif : Nettoyage et fiabilisation du projet

Cette session a été dédiée à un nettoyage en profondeur du projet pour améliorer sa stabilité, sa maintenabilité et ses performances, en suivant une roadmap de nettoyage pré-établie.

**Actions réalisées :**

1.  **Suppression du Bundler Obsolète :**
    *   Le dossier `bundler` contenant l'implémentation de Skandha a été entièrement supprimé, finalisant le pivot stratégique vers un service de bundler hébergé (Pimlico).

2.  **Mise à jour des Dépendances :**
    *   Les dépendances du `frontend` ont été mises à jour vers leurs dernières versions mineures pour bénéficier des corrections de bugs et améliorations sans introduire de changements cassants.
    *   Les dépendances du `backend` et des `smart-contracts` ont été laissées inchangées pour garantir une stabilité maximale, leurs mises à jour étant toutes majeures.

3.  **Nettoyage du Code Mort :**
    *   Le système de Thème (clair/sombre), qui était déconnecté et inutilisé, a été entièrement supprimé du code (`ThemeContext`, `useTheme`, et les éléments d'UI associés).
    *   De nombreuses variables et importations inutilisées ont été supprimées sur l'ensemble du `frontend` grâce à l'outil de linting ESLint.

4.  **Correction des Erreurs de Linting :**
    *   Toutes les erreurs et avertissements remontés par ESLint ont été corrigés, y compris des faux positifs liés à la librairie `framer-motion` et des problèmes de configuration de la règle `no-unused-vars`. Le code est maintenant 100% conforme aux règles de linting.

5.  **Restauration de l'Accès Administrateur :**
    *   Le mot de passe administrateur, qui était perdu, a été réinitialisé avec succès.
    *   Un bug dans la route de changement de mot de passe a été identifié (la mise à jour n'était que "conceptuelle").
    *   Un script temporaire a été créé pour générer un hash bcrypt sécurisé pour le nouveau mot de passe, qui a ensuite été ajouté manuellement au fichier `.env`.

**État du Projet :**
Le projet est maintenant significativement plus propre, plus léger et plus stable. La base de code est plus saine et prête pour des développements futurs. La documentation a été mise à jour pour refléter ces changements.

---

## Objectif : Nettoyer le projet en éliminant le code obsolète et les fichiers inutiles, tout en conservant l'intégrité de l'interface utilisateur (UI).

### Étapes :

1. **Identification des fichiers sources** :
   - Liste les fichiers essentiels au fonctionnement du projet.
   - Ignore les fichiers générés automatiquement (build, dist, node_modules, etc.).

2. **Analyse des dépendances** :
   - Vérifie les dépendances inutilisées dans `package.json`.
   - Propose des solutions pour les supprimer ou les remplacer.

3. **Nettoyage du code** :
   - Supprime les fonctions, classes et variables non utilisées.
   - Élimine le code commenté inutile.

4. **Vérification de l'intégrité de l'UI** :
   - Assure-toi que l'UI reste intacte après les modifications.
   - Propose des tests visuels ou automatisés pour valider l'UI.

5. **Optimisation des performances** :
   - Identifie les parties du code pouvant être optimisées.
   - Suggère des améliorations pour réduire la taille du bundle et améliorer les performances.

6. **Documentation** :
   - Mets à jour ou crée la documentation nécessaire pour le projet.
   - Assure-toi que les instructions d'installation et d'utilisation sont claires.

7. **Tests avant livraison** :
   - Effectue des tests unitaires et d'intégration pour valider les fonctionnalités.
   - Vérifie la compatibilité avec les navigateurs cibles.

### Avertissements :

- **Conservation de l'UI** : Ne modifie pas le code lié à l'interface utilisateur sans validation préalable.
- **Tests** : Effectue des tests approfondis avant toute mise en production.
- **Backup** : Crée une copie de sauvegarde du projet avant de commencer le nettoyage.

### Bonus :

- **Automatisation** : Propose des scripts ou outils pour automatiser le nettoyage et la vérification du projet.
- **Suivi** : Mets en place un système de suivi des modifications pour faciliter la gestion des versions.

---

##  Bonus

- **Automatisation** : Utilisez des outils comme [STYLE-ANALYZER](https://arxiv.org/abs/1904.00935) pour fixer automatiquement les incohérences de style de code.
- **Suivi des modifications** : Mettez en place un système de suivi des modifications pour faciliter la gestion des versions.
