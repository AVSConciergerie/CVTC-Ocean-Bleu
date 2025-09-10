// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CVTCTransferSimple is Ownable(msg.sender), ReentrancyGuard {
    IERC20 public cvtcToken;

    // Configuration de la distribution géométrique
    uint256 public constant GEOMETRIC_THRESHOLD = 1000 * 10**2; // 1000 CVTC
    uint256 public constant BASE_MONTH_INTERVAL = 30 days;
    // Plus de limite MAX_STEPS - la séquence continue jusqu'à épuisement des fonds

    // Mode test pour accélérer les délais
    bool public isTestMode = true;

    function toggleTestMode() external onlyOwner {
        isTestMode = !isTestMode;
    }

    // Structure pour les transferts échelonnés
    struct StaggeredTransfer {
        address sender;
        address receiver;
        uint256 totalAmount;
        uint256 remainingAmount;
        uint256 currentStep;
        uint256 nextReleaseTime;
        uint256[] releaseSchedule;
        bool isActive;
    }

    mapping(uint256 => StaggeredTransfer) public staggeredTransfers;
    mapping(address => uint256[]) public userStaggeredTransfers;
    uint256 public transferCounter;
    uint256 public totalStaggeredReleases;

    // Événements
    event ImmediateTransfer(address indexed sender, address indexed receiver, uint256 amount);
    event StaggeredTransferInitiated(uint256 indexed transferId, address indexed sender, address indexed receiver, uint256 totalAmount, uint256 steps);
    event StaggeredReleaseExecuted(uint256 indexed transferId, address indexed receiver, uint256 amount, uint256 step, uint256 remaining);
    event StaggeredTransferCompleted(uint256 indexed transferId, address indexed receiver, uint256 totalReleased);

    constructor(address _cvtcToken) {
        cvtcToken = IERC20(_cvtcToken);
    }

    // Fonction principale de transfert
    function transfer(address receiver, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(receiver != address(0), "Invalid receiver address");
        require(receiver != msg.sender, "Cannot transfer to self");

        // Vérifier que l'expéditeur a suffisamment de fonds
        require(cvtcToken.balanceOf(msg.sender) >= amount, "Insufficient CVTC balance");
        require(cvtcToken.allowance(msg.sender, address(this)) >= amount, "Insufficient CVTC allowance");

        // Transférer les fonds de l'expéditeur vers le contrat
        require(cvtcToken.transferFrom(msg.sender, address(this), amount), "CVTC transfer failed");

        if (amount < GEOMETRIC_THRESHOLD) {
            // Transfert immédiat pour les montants < 1000 CVTC
            require(cvtcToken.transfer(receiver, amount), "CVTC transfer to receiver failed");
            emit ImmediateTransfer(msg.sender, receiver, amount);
        } else {
            // Distribution géométrique pour les montants >= 1000 CVTC
            uint256[] memory releaseSchedule = _calculateGeometricSchedule(amount);
            uint256 totalSteps = releaseSchedule.length;

            uint256 transferId = ++transferCounter;

            staggeredTransfers[transferId] = StaggeredTransfer({
                sender: msg.sender,
                receiver: receiver,
                totalAmount: amount,
                remainingAmount: amount,
                currentStep: 0,
                nextReleaseTime: block.timestamp + _calculateTimeInterval(0),
                releaseSchedule: releaseSchedule,
                isActive: true
            });

            // Ajouter aux listes de suivi
            userStaggeredTransfers[msg.sender].push(transferId);
            userStaggeredTransfers[receiver].push(transferId);

            emit StaggeredTransferInitiated(transferId, msg.sender, receiver, amount, totalSteps);
        }
    }

    // Fonction pour exécuter une libération échelonnée
    function executeRelease(uint256 transferId) external nonReentrant {
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

        // Programmer la prochaine libération
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

    // Fonction interne pour calculer la distribution géométrique (1, 2, 4, 8, 16, 32, 64, 128, 256...)
    function _calculateGeometricSchedule(uint256 totalAmount) internal pure returns (uint256[] memory) {
        // Estimation du nombre maximum d'étapes nécessaires (log2 du montant maximum)
        uint256 maxSteps = 0;
        uint256 tempAmount = totalAmount;
        while (tempAmount > 0) {
            tempAmount /= 2;
            maxSteps++;
        }

        uint256[] memory schedule = new uint256[](maxSteps);
        uint256 remaining = totalAmount;
        uint256 stepAmount = 1 * 10**2; // Commencer par 1 CVTC (2 décimales)
        uint256 stepCount = 0;

        while (remaining > 0) {
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
        uint256 months = step + 1;

        // Mode test accéléré : 15 secondes = 1 mois
        if (isTestMode) {
            return months * 15 seconds;
        }

        return months * BASE_MONTH_INTERVAL;
    }

    // Fonctions de consultation
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

    function getTransferStats() external view returns (
        uint256 totalTransfers,
        uint256 totalStaggeredReleases,
        uint256 activeTransfers
    ) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= transferCounter; i++) {
            if (staggeredTransfers[i].isActive) {
                activeCount++;
            }
        }

        return (
            transferCounter,
            totalStaggeredReleases,
            activeCount
        );
    }

    // Recevoir des BNB
    receive() external payable {}
}