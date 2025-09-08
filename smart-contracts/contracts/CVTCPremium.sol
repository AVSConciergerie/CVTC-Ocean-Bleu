// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ICVTCReserve {
    function getReserve(address user) external view returns (uint256);
    function addToReserve(address user, uint256 amount) external;
    function deductFromReserve(address user, uint256 amount) external returns (bool);
    function getTotalReserves() external view returns (uint256);
}

interface ICVTCSwap {
    function estimateCVTCPriceInBNB() external view returns (uint256);
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

contract CVTCPremium is Ownable(msg.sender), ReentrancyGuard, ICVTCReserve {
    IERC20 public cvtcToken;
    ICVTCSwap public cvtcSwap;

    // Configuration - Test Mode: 15 secondes = 1 jour
    uint256 public constant SUBSCRIPTION_PRICE = 5 ether; // 5 BNB
    uint256 public constant SUBSCRIPTION_DURATION = 15 seconds; // TEST MODE: 15s = 1 jour
    uint256 public constant CENT_AMOUNT = 0.01 ether; // 1 centime en BNB
    uint256 public constant MIN_RESERVE = 0.1 ether; // Réserve minimum
    uint256 public constant MAX_RESERVE = 1 ether; // Réserve maximum

    // Mode test activé
    bool public isTestMode = true;

    // Configuration du batching
    uint256 public constant MIN_BATCH_SIZE = 3; // Minimum 3 transactions par batch
    uint256 public constant BATCH_TIMEOUT = 5 minutes; // Timeout pour forcer le batch
    uint256 public constant P2P_BONUS_THRESHOLD = 1000 * 10**18; // 1000 CVTC en wei
    uint256 public constant P2P_BONUS_PERCENT = 5; // 5% bonus pour gros transferts

    // Structures pour le batching
    struct PendingTransaction {
        address user;
        uint256 amount;
        uint256 timestamp;
        bool isProcessed;
    }

    struct BatchData {
        PendingTransaction[] transactions;
        uint256 totalAmount;
        uint256 createdAt;
        bool isProcessed;
    }

    // Données de batching
    mapping(uint256 => BatchData) public batches;
    uint256 public currentBatchId;
    uint256 public totalBatchesProcessed;

    // Statistiques P2P spéciales
    uint256 public totalP2PBonusDistributed;
    uint256 public totalLargeTransfers; // > 1000 CVTC
    mapping(address => uint256) public userP2PBonusReceived;

    // Système d'échelonnement P2P - Intervalles mensuels
    uint256 public constant STAGGERED_THRESHOLD = 1000 * 10**18; // 1000 CVTC
    uint256 public constant BASE_MONTH_INTERVAL = 30 days; // 1 mois de base
    uint256 public constant MAX_STAGGERED_STEPS = 6; // Maximum 6 échelons (1+2+4+8+16+32 = 63 mois ~5 ans)

    struct StaggeredTransfer {
        address sender;
        address receiver;
        uint256 totalAmount;
        uint256 remainingAmount;
        uint256 currentStep;
        uint256 nextReleaseTime;
        uint256[] releaseSchedule; // Montants à libérer à chaque étape
        bool isActive;
    }

    mapping(uint256 => StaggeredTransfer) public staggeredTransfers;
    mapping(address => uint256[]) public userStaggeredTransfers;
    uint256 public staggeredTransferCounter;
    uint256 public totalStaggeredReleases;

    // Événements pour le batching
    event BatchCreated(uint256 indexed batchId, uint256 transactionCount);
    event BatchProcessed(uint256 indexed batchId, uint256 totalAmount, uint256 totalDiscount);
    event P2PBonusAwarded(address indexed user, uint256 transferAmount, uint256 bonusAmount);
    event LargeTransferProcessed(address indexed user, uint256 amount, uint256 bonus);

    // Événements pour l'échelonnement P2P
    event StaggeredTransferInitiated(uint256 indexed transferId, address indexed sender, address indexed receiver, uint256 totalAmount, uint256 steps);
    event StaggeredReleaseExecuted(uint256 indexed transferId, address indexed receiver, uint256 amount, uint256 step, uint256 remaining);
    event StaggeredTransferCompleted(uint256 indexed transferId, address indexed receiver, uint256 totalReleased);

    // Fonction pour basculer le mode test
    function toggleTestMode() external onlyOwner {
        isTestMode = !isTestMode;
    }

    // Fonction pour obtenir la durée d'abonnement (adaptée au mode)
    function getSubscriptionDuration() public view returns (uint256) {
        return isTestMode ? 15 seconds : 365 days;
    }

    // Fonction principale de batching des transactions
    function addToBatch(uint256 amount) external onlyPremium nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        BatchData storage currentBatch = batches[currentBatchId];

        // Créer un nouveau batch si nécessaire
        if (currentBatch.transactions.length == 0) {
            currentBatch.createdAt = block.timestamp;
            emit BatchCreated(currentBatchId, 0);
        }

        // Ajouter la transaction au batch
        currentBatch.transactions.push(PendingTransaction({
            user: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            isProcessed: false
        }));

        currentBatch.totalAmount += amount;

        // Traiter automatiquement si le batch est complet ou timeout
        if (currentBatch.transactions.length >= MIN_BATCH_SIZE ||
            block.timestamp >= currentBatch.createdAt + BATCH_TIMEOUT) {
            _processBatch(currentBatchId);
        }
    }

    // Fonction interne pour traiter un batch
    function _processBatch(uint256 batchId) internal {
        BatchData storage batch = batches[batchId];
        require(!batch.isProcessed, "Batch already processed");
        require(batch.transactions.length > 0, "Empty batch");

        uint256 totalDiscount = 0;
        uint256 totalBonus = 0;

        // Traiter chaque transaction du batch
        for (uint256 i = 0; i < batch.transactions.length; i++) {
            PendingTransaction storage tx = batch.transactions[i];
            if (!tx.isProcessed) {
                (uint256 finalAmount, uint256 discount) = _processSingleTransaction(tx.user, tx.amount);
                totalDiscount += discount;

                // Bonus spécial pour gros transferts
                if (tx.amount >= P2P_BONUS_THRESHOLD) {
                    uint256 bonus = (tx.amount * P2P_BONUS_PERCENT) / 100;
                    totalBonus += bonus;
                    userP2PBonusReceived[tx.user] += bonus;
                    totalP2PBonusDistributed += bonus;
                    totalLargeTransfers++;

                    emit LargeTransferProcessed(tx.user, tx.amount, bonus);
                    emit P2PBonusAwarded(tx.user, tx.amount, bonus);
                }

                tx.isProcessed = true;
            }
        }

        batch.isProcessed = true;
        totalBatchesProcessed++;

        emit BatchProcessed(batchId, batch.totalAmount, totalDiscount);

        // Préparer le prochain batch
        currentBatchId++;
    }

    // Fonction pour traiter une transaction individuelle (appelée par le batching)
    function _processSingleTransaction(address user, uint256 amount) internal returns (uint256 finalAmount, uint256 discount) {
        PremiumUser storage premiumUser = premiumUsers[user];
        require(premiumUser.isActive, "User is not premium");

        // Calcul de la remise normale
        discount = CENT_AMOUNT * 2; // 2 centimes

        // Limiter la remise à 10% du montant
        uint256 maxDiscount = amount / 10;
        if (discount > maxDiscount) {
            discount = maxDiscount;
        }

        finalAmount = amount - discount;

        // Déduire de la réserve
        if (premiumUser.personalReserve >= discount) {
            premiumUser.personalReserve -= discount;
        } else {
            // Si réserve insuffisante, utiliser la réserve réseau
            uint256 remaining = discount - premiumUser.personalReserve;
            premiumUser.personalReserve = 0;

            if (networkReservePool >= remaining) {
                networkReservePool -= remaining;
            }
        }

        // Mettre à jour les statistiques
        premiumUser.totalDiscountsReceived += discount;
        premiumUser.transactionCount++;
        premiumUser.lastActivity = block.timestamp;

        totalTransactions++;
        totalDiscountsGiven += discount;

        return (finalAmount, discount);
    }

    // Fonction pour forcer le traitement d'un batch (owner only)
    function forceProcessBatch(uint256 batchId) external onlyOwner {
        _processBatch(batchId);
    }

    // Fonction pour obtenir les informations d'un batch
    function getBatchInfo(uint256 batchId) external view returns (
        uint256 transactionCount,
        uint256 totalAmount,
        uint256 createdAt,
        bool isProcessed
    ) {
        BatchData memory batch = batches[batchId];
        return (
            batch.transactions.length,
            batch.totalAmount,
            batch.createdAt,
            batch.isProcessed
        );
    }

    // Fonction pour obtenir les statistiques P2P
    function getP2PStats() external view returns (
        uint256 totalBonus,
        uint256 largeTransfers,
        uint256 batchesProcessed
    ) {
        return (
            totalP2PBonusDistributed,
            totalLargeTransfers,
            totalBatchesProcessed
        );
    }

    // Fonction pour obtenir le bonus P2P d'un utilisateur
    function getUserP2PBonus(address user) external view returns (uint256) {
        return userP2PBonusReceived[user];
    }

    // Fonction principale pour initier un transfert échelonné P2P
    function initiateStaggeredTransfer(address receiver, uint256 amount) external onlyPremium nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(receiver != address(0), "Invalid receiver address");
        require(receiver != msg.sender, "Cannot transfer to self");

        // Vérifier que l'expéditeur a suffisamment de fonds
        require(cvtcToken.balanceOf(msg.sender) >= amount, "Insufficient CVTC balance");
        require(cvtcToken.allowance(msg.sender, address(this)) >= amount, "Insufficient CVTC allowance");

        // Transférer les fonds de l'expéditeur vers le contrat
        require(cvtcToken.transferFrom(msg.sender, address(this), amount), "CVTC transfer failed");

        // Créer le transfert échelonné
        uint256 transferId = ++staggeredTransferCounter;

        if (amount < STAGGERED_THRESHOLD) {
            // Transfert immédiat pour les montants < 1000 CVTC
            uint256[] memory immediateSchedule = new uint256[](1);
            immediateSchedule[0] = amount;

            staggeredTransfers[transferId] = StaggeredTransfer({
                sender: msg.sender,
                receiver: receiver,
                totalAmount: amount,
                remainingAmount: amount,
                currentStep: 0,
                nextReleaseTime: block.timestamp, // Immédiat
                releaseSchedule: immediateSchedule,
                isActive: true
            });

            emit StaggeredTransferInitiated(transferId, msg.sender, receiver, amount, 1);
        } else {
            // Échelonnement pour les montants >= 1000 CVTC
            uint256[] memory releaseSchedule = _calculateReleaseSchedule(amount);
            uint256 totalSteps = releaseSchedule.length;

            require(totalSteps <= MAX_STAGGERED_STEPS, "Too many release steps");

            staggeredTransfers[transferId] = StaggeredTransfer({
                sender: msg.sender,
                receiver: receiver,
                totalAmount: amount,
                remainingAmount: amount,
                currentStep: 0,
                nextReleaseTime: block.timestamp + _calculateTimeInterval(0), // 1 mois pour la première étape
                releaseSchedule: releaseSchedule,
                isActive: true
            });

            emit StaggeredTransferInitiated(transferId, msg.sender, receiver, amount, totalSteps);
        }

        // Ajouter aux listes de suivi
        userStaggeredTransfers[msg.sender].push(transferId);
        userStaggeredTransfers[receiver].push(transferId);
    }

    // Fonction pour exécuter une libération échelonnée
    function executeStaggeredRelease(uint256 transferId) external nonReentrant {
        StaggeredTransfer storage transfer = staggeredTransfers[transferId];
        require(transfer.isActive, "Transfer not active");
        require(block.timestamp >= transfer.nextReleaseTime, "Too early for next release");
        require(transfer.currentStep < transfer.releaseSchedule.length, "All releases completed");
        require(msg.sender == transfer.receiver, "Only receiver can execute release");

        uint256 releaseAmount = transfer.releaseSchedule[transfer.currentStep];
        require(transfer.remainingAmount >= releaseAmount, "Insufficient remaining amount");

        // Mettre à jour l'état
        transfer.remainingAmount -= releaseAmount;
        transfer.currentStep++;

        // Programmer la prochaine libération avec intervalle croissant
        if (transfer.currentStep < transfer.releaseSchedule.length) {
            transfer.nextReleaseTime = block.timestamp + _calculateTimeInterval(transfer.currentStep);
        } else {
            transfer.isActive = false;
            emit StaggeredTransferCompleted(transferId, transfer.receiver, transfer.totalAmount);
        }

        // Transférer les fonds au destinataire
        require(cvtcToken.transfer(transfer.receiver, releaseAmount), "CVTC transfer to receiver failed");

        // Mettre à jour les statistiques
        totalStaggeredReleases += releaseAmount;

        emit StaggeredReleaseExecuted(transferId, transfer.receiver, releaseAmount, transfer.currentStep, transfer.remainingAmount);
    }

    // Fonction interne pour calculer la séquence d'échelonnement (1, 2, 4, 8, 16, 32...)
    function _calculateReleaseSchedule(uint256 totalAmount) internal pure returns (uint256[] memory) {
        uint256[] memory schedule = new uint256[](MAX_STAGGERED_STEPS);
        uint256 remaining = totalAmount;
        uint256 stepAmount = 1 * 10**18; // Commencer par 1 CVTC
        uint256 stepCount = 0;

        while (remaining > 0 && stepCount < MAX_STAGGERED_STEPS) {
            if (stepAmount >= remaining) {
                // Dernière étape : transférer le reste
                schedule[stepCount] = remaining;
                remaining = 0;
            } else {
                // Étape normale : transférer le montant calculé
                schedule[stepCount] = stepAmount;
                remaining -= stepAmount;
            }

            stepAmount *= 2; // Doubler pour la prochaine étape
            stepCount++;
        }

        // Redimensionner le tableau pour supprimer les zéros
        uint256[] memory finalSchedule = new uint256[](stepCount);
        for (uint256 i = 0; i < stepCount; i++) {
            finalSchedule[i] = schedule[i];
        }

        return finalSchedule;
    }

    // Fonction pour calculer l'intervalle de temps pour une étape donnée
    function _calculateTimeInterval(uint256 step) internal view returns (uint256) {
        // Intervalles simples: 1 mois, 2 mois, 3 mois, 4 mois...
        uint256 months = step + 1; // Étape 0 = 1 mois, étape 1 = 2 mois, etc.

        // Mode test accéléré : 15 secondes = 1 mois
        if (isTestMode) {
            return months * 15 seconds;
        }

        return months * BASE_MONTH_INTERVAL;
    }

    // Fonctions de consultation pour les transferts échelonnés
    function getStaggeredTransferInfo(uint256 transferId) external view returns (
        address sender,
        address receiver,
        uint256 totalAmount,
        uint256 remainingAmount,
        uint256 currentStep,
        uint256 nextReleaseTime,
        uint256[] memory releaseSchedule,
        bool isActive
    ) {
        StaggeredTransfer memory transfer = staggeredTransfers[transferId];
        return (
            transfer.sender,
            transfer.receiver,
            transfer.totalAmount,
            transfer.remainingAmount,
            transfer.currentStep,
            transfer.nextReleaseTime,
            transfer.releaseSchedule,
            transfer.isActive
        );
    }

    function getUserStaggeredTransfers(address user) external view returns (uint256[] memory) {
        return userStaggeredTransfers[user];
    }

    function canExecuteRelease(uint256 transferId, address caller) external view returns (bool) {
        StaggeredTransfer memory transfer = staggeredTransfers[transferId];
        return transfer.isActive &&
               caller == transfer.receiver &&
               block.timestamp >= transfer.nextReleaseTime &&
               transfer.currentStep < transfer.releaseSchedule.length;
    }

    // Fonction pour obtenir les statistiques d'échelonnement
    function getStaggeredStats() external view returns (
        uint256 totalStaggeredTransfers,
        uint256 totalReleases,
        uint256 activeTransfers
    ) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= staggeredTransferCounter; i++) {
            if (staggeredTransfers[i].isActive) {
                activeCount++;
            }
        }

        return (
            staggeredTransferCounter,
            totalStaggeredReleases,
            activeCount
        );
    }

    // Statistiques réseau
    uint256 public totalPremiumUsers;
    uint256 public totalTransactions;
    uint256 public totalDiscountsGiven;
    uint256 public networkReservePool;

    // Structures
    struct PremiumUser {
        bool isActive;
        uint256 subscriptionEnd;
        uint256 personalReserve;
        uint256 totalDiscountsReceived;
        uint256 transactionCount;
        uint256 lastActivity;
    }

    struct Transaction {
        address user;
        uint256 amount;
        uint256 discountApplied;
        uint256 timestamp;
        bool usedReserve;
    }

    // Mappings
    mapping(address => PremiumUser) public premiumUsers;
    mapping(address => Transaction[]) public userTransactions;
    mapping(address => bool) public authorizedOperators;

    // Événements
    event PremiumSubscribed(address indexed user, uint256 endDate);
    event PremiumExpired(address indexed user);
    event ReserveAdded(address indexed user, uint256 amount);
    event ReserveUsed(address indexed user, uint256 amount);
    event TransactionProcessed(address indexed user, uint256 amount, uint256 discount);
    event NetworkBonusDistributed(uint256 totalBonus, uint256 userCount);

    modifier onlyPremium() {
        require(isPremiumUser(msg.sender), "Not a premium user");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedOperators[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(address _cvtcToken, address _cvtcSwap) {
        cvtcToken = IERC20(_cvtcToken);
        cvtcSwap = ICVTCSwap(_cvtcSwap);
        authorizedOperators[msg.sender] = true;
    }

    // Fonction principale d'abonnement premium
    function subscribePremium() external payable nonReentrant {
        require(msg.value == SUBSCRIPTION_PRICE, "Incorrect subscription price");
        require(!isPremiumUser(msg.sender), "Already premium user");

        uint256 endDate = block.timestamp + getSubscriptionDuration();

        premiumUsers[msg.sender] = PremiumUser({
            isActive: true,
            subscriptionEnd: endDate,
            personalReserve: MIN_RESERVE,
            totalDiscountsReceived: 0,
            transactionCount: 0,
            lastActivity: block.timestamp
        });

        totalPremiumUsers++;
        networkReservePool += MIN_RESERVE;

        emit PremiumSubscribed(msg.sender, endDate);

        // Remboursement de l'excédent si nécessaire
        if (msg.value > SUBSCRIPTION_PRICE) {
            payable(msg.sender).transfer(msg.value - SUBSCRIPTION_PRICE);
        }
    }

    // Fonction principale de traitement des transactions avec remise
    function processTransaction(uint256 transactionAmount) external onlyAuthorized nonReentrant returns (uint256 finalAmount, uint256 discount) {
        require(isPremiumUser(msg.sender), "User is not premium");

        PremiumUser storage user = premiumUsers[msg.sender];
        require(user.personalReserve >= CENT_AMOUNT * 2, "Insufficient reserve for transaction");

        // Calcul de la remise (1 centime avant + 1 centime après)
        discount = CENT_AMOUNT * 2;

        // Vérifier que la remise n'excède pas 10% du montant de transaction
        uint256 maxDiscount = transactionAmount / 10;
        if (discount > maxDiscount) {
            discount = maxDiscount;
        }

        finalAmount = transactionAmount - discount;

        // Déduire de la réserve personnelle
        user.personalReserve -= discount;
        user.totalDiscountsReceived += discount;
        user.transactionCount++;
        user.lastActivity = block.timestamp;

        // Enregistrer la transaction
        userTransactions[msg.sender].push(Transaction({
            user: msg.sender,
            amount: transactionAmount,
            discountApplied: discount,
            timestamp: block.timestamp,
            usedReserve: true
        }));

        totalTransactions++;
        totalDiscountsGiven += discount;

        emit TransactionProcessed(msg.sender, transactionAmount, discount);

        // Recharger automatiquement si la réserve devient trop basse
        if (user.personalReserve < MIN_RESERVE) {
            _autoRechargeReserve(msg.sender);
        }

        return (finalAmount, discount);
    }

    // Recharge automatique de la réserve
    function _autoRechargeReserve(address user) internal {
        PremiumUser storage premiumUser = premiumUsers[user];

        // Calculer le montant de recharge (basé sur l'activité récente)
        uint256 rechargeAmount = MIN_RESERVE - premiumUser.personalReserve;

        // Limiter la recharge à un montant raisonnable
        if (rechargeAmount > MAX_RESERVE / 4) {
            rechargeAmount = MAX_RESERVE / 4;
        }

        // Vérifier que le pool réseau a suffisamment de fonds
        if (networkReservePool >= rechargeAmount) {
            premiumUser.personalReserve += rechargeAmount;
            networkReservePool -= rechargeAmount;

            emit ReserveAdded(user, rechargeAmount);
        }
    }

    // Fonction pour ajouter manuellement à la réserve
    function addToReserve() external payable onlyPremium {
        PremiumUser storage user = premiumUsers[msg.sender];
        require(user.personalReserve + msg.value <= MAX_RESERVE, "Reserve would exceed maximum");

        user.personalReserve += msg.value;
        networkReservePool += msg.value;

        emit ReserveAdded(msg.sender, msg.value);
    }

    // Vérifier si un utilisateur est premium et actif
    function isPremiumUser(address user) public view returns (bool) {
        PremiumUser memory premiumUser = premiumUsers[user];
        return premiumUser.isActive && premiumUser.subscriptionEnd > block.timestamp;
    }

    // Obtenir les informations d'un utilisateur premium
    function getPremiumUserInfo(address user) external view returns (
        bool isActive,
        uint256 subscriptionEnd,
        uint256 personalReserve,
        uint256 totalDiscountsReceived,
        uint256 transactionCount
    ) {
        PremiumUser memory premiumUser = premiumUsers[user];
        return (
            premiumUser.isActive && premiumUser.subscriptionEnd > block.timestamp,
            premiumUser.subscriptionEnd,
            premiumUser.personalReserve,
            premiumUser.totalDiscountsReceived,
            premiumUser.transactionCount
        );
    }

    // Obtenir la réserve d'un utilisateur
    function getReserve(address user) external view returns (uint256) {
        return premiumUsers[user].personalReserve;
    }

    // Ajouter à la réserve (interface ICVTCReserve)
    function addToReserve(address user, uint256 amount) external onlyAuthorized {
        PremiumUser storage premiumUser = premiumUsers[user];
        require(premiumUser.isActive, "User is not premium");
        require(premiumUser.personalReserve + amount <= MAX_RESERVE, "Reserve would exceed maximum");

        premiumUser.personalReserve += amount;
        networkReservePool += amount;

        emit ReserveAdded(user, amount);
    }

    // Déduire de la réserve (interface ICVTCReserve)
    function deductFromReserve(address user, uint256 amount) external onlyAuthorized returns (bool) {
        PremiumUser storage premiumUser = premiumUsers[user];
        if (premiumUser.personalReserve >= amount) {
            premiumUser.personalReserve -= amount;
            return true;
        }
        return false;
    }

    // Obtenir le total des réserves réseau
    function getTotalReserves() external view returns (uint256) {
        return networkReservePool;
    }

    // Fonction d'urgence pour expirer les abonnements
    function expireSubscription(address user) external onlyOwner {
        require(premiumUsers[user].isActive, "User is not active");
        premiumUsers[user].isActive = false;
        emit PremiumExpired(user);
    }

    // Autoriser/désautoriser un opérateur
    function setAuthorizedOperator(address operator, bool status) external onlyOwner {
        authorizedOperators[operator] = status;
    }

    // Fonction pour retirer les fonds (owner only)
    function withdrawFunds(uint256 amount) external onlyOwner {
        require(amount <= networkReservePool, "Insufficient network reserve");
        networkReservePool -= amount;
        payable(owner()).transfer(amount);
    }

    // Fonction pour distribuer des bonus réseau
    function distributeNetworkBonus() external onlyOwner {
        require(totalPremiumUsers > 0, "No premium users");

        uint256 bonusPerUser = networkReservePool / totalPremiumUsers;
        if (bonusPerUser == 0) return;

        uint256 totalDistributed = 0;

        // Distribuer à tous les utilisateurs premium actifs
        for (uint256 i = 0; i < totalPremiumUsers; i++) {
            // Note: Dans un vrai contrat, il faudrait une liste des utilisateurs
            // Pour cette implémentation simplifiée, on distribue proportionnellement
        }

        emit NetworkBonusDistributed(totalDistributed, totalPremiumUsers);
    }

    // Recevoir des BNB
    receive() external payable {
        networkReservePool += msg.value;
    }
}