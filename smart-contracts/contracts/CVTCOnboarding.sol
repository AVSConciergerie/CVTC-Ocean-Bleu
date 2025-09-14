// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CVTCOnboarding
 * @notice Contrat principal pour le système d'onboarding CVTC
 * @dev Gère le processus de 30 jours avec prêt initial, swaps quotidiens et remboursement progressif
 */

// Interface pour le pool de swap CVTC
interface ICVTCSwap {
    function buy(uint256 minCvtcOut) external payable;
    function sell(uint256 cvtcAmount, uint256 minBnbOut) external;
    function getReserves() external view returns (uint256, uint256);
    function cvtcToken() external view returns (address);
    function whitelisted(address) external view returns (bool);
    function updateWhitelist(address user, bool status) external;
}

contract CVTCOnboarding is Ownable, ReentrancyGuard {
    // Interfaces pour les contrats externes
    IERC20 public cvtcToken;

    // Interface pour le pool de swap CVTC
    ICVTCSwap public cvtcSwap;

    // Configuration des montants (en wei pour précision)
    uint256 public constant INITIAL_LOAN = 0.30 ether; // 0,30€ BNB prêtés
    uint256 public constant DAILY_SWAP_AMOUNT = 0.000013 ether; // 0,01€ en BNB (≈0.000013 BNB à 770€/BNB)
    uint256 public constant ONBOARDING_DURATION = 30 days;

    // Paliers de remboursement (en CVTC)
    uint256 public constant PALIER_1_CVTC = 0.30 ether; // 0,30€ CVTC
    uint256 public constant PALIER_2_CVTC = 0.05 ether; // 0,05€ CVTC
    uint256 public constant PALIER_3_CVTC = 0.00175 ether; // 0,5% de 0,35€

    // Pourcentages de remboursement
    uint256 public constant REMBOURSEMENT_1_PERCENT = 10; // 10%
    uint256 public constant REMBOURSEMENT_2_PERCENT = 30; // 30%
    uint256 public constant REMBOURSEMENT_3_PERCENT = 60; // 60%

    // Configuration du recyclage
    uint256 public constant RECYCLE_FIXED = 0.05 ether; // 0,05€ fixe
    uint256 public constant RECYCLE_PERCENTAGE = 5; // 0,5%

    // Compteurs et statistiques
    uint256 public totalUsers;
    uint256 public activeUsers;
    uint256 public completedUsers;
    uint256 public totalLoansGiven;
    uint256 public totalRepaid;
    uint256 public totalRecycled;

    // Structure utilisateur
    struct OnboardingUser {
        address userAddress;
        uint256 startDate;
        uint256 loanReceived;     // 0,30€ BNB reçus
        uint256 totalSwapped;     // Total BNB swappé en CVTC
        uint256 cvtcAccumulated;  // CVTC accumulés
        uint256 repaidAmount;     // Montant remboursé
        uint256 lastSwapDate;     // Date du dernier swap
        uint8 currentPalier;      // Palier actuel (0-3)
        bool isActive;
        bool completed;
        bool termsAccepted;
    }

    // Mappings
    mapping(address => OnboardingUser) public onboardingUsers;
    mapping(address => bool) public authorizedOperators; // Pour les appels backend

    // Événements
    event OnboardingStarted(address indexed user, uint256 loanAmount, uint256 startDate);
    event DailySwapExecuted(address indexed user, uint256 bnbAmount, uint256 cvtcReceived);
    event RepaymentProcessed(address indexed user, uint8 palier, uint256 amount);
    event OnboardingCompleted(address indexed user, uint256 totalCvtcKept);
    event FundsRecycled(uint256 amount, uint256 reason);

    // Modifiers
    modifier onlyAuthorized() {
        require(authorizedOperators[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    modifier onlyActiveUser() {
        require(onboardingUsers[msg.sender].isActive, "User not active");
        require(!onboardingUsers[msg.sender].completed, "Onboarding completed");
        _;
    }

    /**
     * @notice Constructeur
     * @param _cvtcToken Adresse du token CVTC
     * @param _cvtcSwap Adresse du pool de swap CVTC
     */
    constructor(address _cvtcToken, address _cvtcSwap) Ownable(msg.sender) {
        cvtcToken = IERC20(_cvtcToken);
        cvtcSwap = ICVTCSwap(_cvtcSwap);
        authorizedOperators[msg.sender] = true;
    }

    /**
     * @notice Fonction principale d'acceptation des CGU et démarrage de l'onboarding
     * @dev Un seul clic pour tout déclencher
     */
    function acceptOnboardingTerms() external nonReentrant {
        require(!onboardingUsers[msg.sender].isActive, "Already active");
        require(!onboardingUsers[msg.sender].completed, "Already completed");

        // Créer le profil utilisateur
        OnboardingUser storage user = onboardingUsers[msg.sender];
        user.userAddress = msg.sender;
        user.startDate = block.timestamp;
        user.loanReceived = INITIAL_LOAN;
        user.currentPalier = 0;
        user.isActive = true;
        user.termsAccepted = true;
        user.lastSwapDate = block.timestamp;

        // Incrémenter les compteurs
        totalUsers++;
        activeUsers++;
        totalLoansGiven += INITIAL_LOAN;

        // Verser le prêt initial (cette fonction doit être appelée par le paymaster)
        // Le paymaster appellera cette fonction et versera les fonds
        payable(msg.sender).transfer(INITIAL_LOAN);

        emit OnboardingStarted(msg.sender, INITIAL_LOAN, block.timestamp);
    }

    /**
     * @notice Exécute le swap quotidien automatique
     * @dev Appelée par le backend/oracle chaque jour
     * @param user Adresse de l'utilisateur
     */
    function executeDailySwap(address user) external onlyAuthorized nonReentrant {
        OnboardingUser storage userData = onboardingUsers[user];
        require(userData.isActive, "User not active");
        require(!userData.completed, "Onboarding completed");
        require(block.timestamp >= userData.lastSwapDate + 1 days, "Too early for next swap");
        require(block.timestamp <= userData.startDate + ONBOARDING_DURATION, "Onboarding period ended");

        // Vérifier que l'utilisateur a suffisamment de BNB
        require(address(this).balance >= DAILY_SWAP_AMOUNT, "Insufficient contract balance");

        // Effectuer le swap BNB → CVTC via le pool
        // Cette fonction devra être intégrée avec CVTCSwap.sol
        uint256 cvtcReceived = _performSwap(user, DAILY_SWAP_AMOUNT);

        // Mettre à jour les données utilisateur
        userData.totalSwapped += DAILY_SWAP_AMOUNT;
        userData.cvtcAccumulated += cvtcReceived;
        userData.lastSwapDate = block.timestamp;

        emit DailySwapExecuted(user, DAILY_SWAP_AMOUNT, cvtcReceived);

        // Vérifier et traiter les paliers de remboursement
        _checkAndProcessRepaymentPaliers(user);
    }

    /**
     * @notice Effectue le swap BNB → CVTC via le pool
     * @dev Fonction interne qui appelle CVTCSwap
     * @param user Adresse de l'utilisateur
     * @param bnbAmount Montant BNB à swapper
     * @return cvtcReceived Montant CVTC reçu
     */
    function _performSwap(address user, uint256 bnbAmount) internal returns (uint256 cvtcReceived) {
        // Vérifier que l'utilisateur est whitelisted sur le pool
        if (!cvtcSwap.whitelisted(user)) {
            // Auto-whitelist l'utilisateur pour l'onboarding
            cvtcSwap.updateWhitelist(user, true);
        }

        // Obtenir le solde CVTC avant le swap
        uint256 cvtcBalanceBefore = cvtcToken.balanceOf(address(this));

        // Effectuer le swap BNB → CVTC
        // Calculer le montant minimum de CVTC attendu (avec slippage de 5%)
        uint256 minCvtcOut = _calculateMinOut(bnbAmount);

        // Appeler la fonction buy du pool de swap
        cvtcSwap.buy{value: bnbAmount}(minCvtcOut);

        // Calculer le montant de CVTC reçu
        uint256 cvtcBalanceAfter = cvtcToken.balanceOf(address(this));
        cvtcReceived = cvtcBalanceAfter - cvtcBalanceBefore;

        // Vérifier que nous avons reçu au moins le minimum attendu
        require(cvtcReceived >= minCvtcOut, "Insufficient CVTC received from swap");

        // Transférer les CVTC à l'utilisateur
        require(cvtcToken.transfer(user, cvtcReceived), "CVTC transfer to user failed");

        return cvtcReceived;
    }

    /**
     * @notice Calcule le montant minimum de CVTC attendu pour un swap
     * @param bnbAmount Montant BNB à swapper
     * @return minCvtcOut Montant minimum de CVTC attendu
     */
    function _calculateMinOut(uint256 bnbAmount) internal view returns (uint256 minCvtcOut) {
        // Obtenir les réserves actuelles du pool
        (uint256 bnbReserve, uint256 cvtcReserve) = cvtcSwap.getReserves();

        // Calculer le montant de sortie selon la formule AMM
        uint256 amountInWithFee = bnbAmount * 997; // 0.3% fee
        uint256 numerator = amountInWithFee * cvtcReserve;
        uint256 denominator = bnbReserve * 1000 + amountInWithFee;
        uint256 expectedOut = numerator / denominator;

        // Appliquer un slippage de 5% pour la sécurité
        minCvtcOut = expectedOut * 95 / 100;

        return minCvtcOut;
    }

    /**
     * @notice Vérifie et traite les paliers de remboursement
     * @param user Adresse de l'utilisateur
     */
    function _checkAndProcessRepaymentPaliers(address user) internal {
        OnboardingUser storage userData = onboardingUsers[user];
        uint256 currentCVTC = userData.cvtcAccumulated;

        // Palier 1 : 0,30€ CVTC
        if (userData.currentPalier == 0 && currentCVTC >= PALIER_1_CVTC) {
            _processRepayment(user, REMBOURSEMENT_1_PERCENT);
            userData.currentPalier = 1;
        }
        // Palier 2 : 0,05€ CVTC
        else if (userData.currentPalier == 1 && currentCVTC >= PALIER_2_CVTC) {
            _processRepayment(user, REMBOURSEMENT_2_PERCENT);
            userData.currentPalier = 2;
        }
        // Palier 3 : 0,00175€ CVTC
        else if (userData.currentPalier == 2 && currentCVTC >= PALIER_3_CVTC) {
            _processRepayment(user, REMBOURSEMENT_3_PERCENT);
            userData.currentPalier = 3;

            // Marquer comme terminé
            _completeOnboarding(user);
        }
    }

    /**
     * @notice Traite le remboursement pour un palier
     * @param user Adresse de l'utilisateur
     * @param percentage Pourcentage à rembourser
     */
    function _processRepayment(address user, uint256 percentage) internal {
        OnboardingUser storage userData = onboardingUsers[user];
        uint256 repaymentAmount = (userData.loanReceived * percentage) / 100;

        // Calculer le montant à recycler
        uint256 recycleAmount = RECYCLE_FIXED + (repaymentAmount * RECYCLE_PERCENTAGE / 100);
        uint256 actualRepayment = repaymentAmount - recycleAmount;

        // Mettre à jour les statistiques
        userData.repaidAmount += actualRepayment;
        totalRepaid += actualRepayment;
        totalRecycled += recycleAmount;

        // Recycler les fonds pour de nouveaux utilisateurs
        // TODO: Transférer vers le paymaster

        emit RepaymentProcessed(user, userData.currentPalier + 1, actualRepayment);
        emit FundsRecycled(recycleAmount, userData.currentPalier + 1);
    }

    /**
     * @notice Finalise l'onboarding
     * @param user Adresse de l'utilisateur
     */
    function _completeOnboarding(address user) internal {
        OnboardingUser storage userData = onboardingUsers[user];
        userData.completed = true;
        userData.isActive = false;

        activeUsers--;
        completedUsers++;

        emit OnboardingCompleted(user, userData.cvtcAccumulated);
    }

    /**
     * @notice Obtient le statut d'onboarding d'un utilisateur
     * @param user Adresse de l'utilisateur
     */
    function getUserOnboardingStatus(address user) external view returns (
        bool isActive,
        bool completed,
        uint256 daysRemaining,
        uint256 cvtcAccumulated,
        uint8 currentPalier,
        uint256 totalRepaid
    ) {
        OnboardingUser memory userData = onboardingUsers[user];

        uint256 daysRemainingCalc = 0;
        if (userData.isActive && !userData.completed) {
            uint256 endDate = userData.startDate + ONBOARDING_DURATION;
            if (block.timestamp < endDate) {
                daysRemainingCalc = (endDate - block.timestamp) / 1 days;
            }
        }

        return (
            userData.isActive,
            userData.completed,
            daysRemainingCalc,
            userData.cvtcAccumulated,
            userData.currentPalier,
            userData.repaidAmount
        );
    }

    /**
     * @notice Obtient les statistiques globales
     */
    function getGlobalStats() external view returns (
        uint256 _totalUsers,
        uint256 _activeUsers,
        uint256 _completedUsers,
        uint256 _totalLoansGiven,
        uint256 _totalRepaid,
        uint256 _totalRecycled
    ) {
        return (
            totalUsers,
            activeUsers,
            completedUsers,
            totalLoansGiven,
            totalRepaid,
            totalRecycled
        );
    }

    /**
     * @notice Autorise/désautorise un opérateur
     * @param operator Adresse de l'opérateur
     * @param status Statut d'autorisation
     */
    function setAuthorizedOperator(address operator, bool status) external onlyOwner {
        authorizedOperators[operator] = status;
    }

    /**
     * @notice Fonction d'urgence pour terminer un onboarding
     * @param user Adresse de l'utilisateur
     */
    function emergencyCompleteOnboarding(address user) external onlyOwner {
        OnboardingUser storage userData = onboardingUsers[user];
        require(userData.isActive, "User not active");

        _completeOnboarding(user);
    }

    /**
     * @notice Permet au contrat de recevoir des BNB
     */
    receive() external payable {}

    /**
     * @notice Retire les fonds (owner only)
     * @param amount Montant à retirer
     */
    function withdrawFunds(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(amount);
    }
}