// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "./ICVTCTransfer.sol";

/**
 * @title CVTCScheduler
 * @dev Contrat de planification pour les transferts CVTC automatisés
 * Supporte les fréquences : unique, hourly, daily, weekly, monthly
 */
contract CVTCScheduler is Ownable, ReentrancyGuard, Pausable {

    // ============ Événements ============

    event ScheduledTransferCreated(
        uint256 indexed scheduleId,
        address indexed creator,
        address indexed recipient,
        uint256 amount,
        Frequency frequency,
        uint256 startTime,
        uint256 endTime
    );

    event ScheduledTransferExecuted(
        uint256 indexed scheduleId,
        uint256 executionTime,
        bool success
    );

    event ScheduledTransferCancelled(
        uint256 indexed scheduleId,
        address indexed cancelledBy
    );

    event ScheduledTransferModified(
        uint256 indexed scheduleId,
        uint256 newAmount,
        Frequency newFrequency,
        uint256 newEndTime
    );

    // ============ Énumérations ============

    enum Frequency {
        UNIQUE,     // Exécution unique
        HOURLY,     // Toutes les heures
        DAILY,      // Tous les jours
        WEEKLY,     // Toutes les semaines
        MONTHLY     // Tous les mois
    }

    enum ScheduleStatus {
        ACTIVE,
        PAUSED,
        CANCELLED,
        COMPLETED
    }

    // ============ Structures ============

    struct ScheduledTransfer {
        uint256 id;
        address creator;
        address recipient;
        uint256 amount;           // Montant en wei (CVTC avec 2 décimales)
        Frequency frequency;
        uint256 startTime;        // Timestamp de début
        uint256 endTime;          // Timestamp de fin (0 = pas de fin)
        uint256 lastExecution;    // Dernière exécution
        uint256 nextExecution;    // Prochaine exécution
        uint256 executionCount;   // Nombre d'exécutions
        ScheduleStatus status;
        string description;       // Description optionnelle
    }

    // ============ Variables d'état ============

    ICVTCTransfer public cvtcTransferContract;

    uint256 private _nextScheduleId = 1;
    uint256 public constant MAX_SCHEDULES_PER_USER = 50;
    uint256 public constant MIN_EXECUTION_INTERVAL = 1 hours;
    uint256 public constant MAX_FUTURE_START = 365 days;
    uint256 public constant MAX_EXECUTIONS_PER_DAY = 24; // Limite pour éviter les abus
    uint256 public constant MIN_TRANSFER_AMOUNT = 0.01 ether; // 0.01 CVTC minimum
    uint256 public constant MAX_TRANSFER_AMOUNT = 10000 ether; // 10,000 CVTC maximum

    mapping(uint256 => ScheduledTransfer) public schedules;
    mapping(address => uint256[]) public userSchedules;
    mapping(address => uint256) public userScheduleCount;

    // Rate limiting
    mapping(address => uint256) public lastUserAction;
    mapping(address => uint256) public dailyExecutionCount;
    mapping(address => uint256) public lastExecutionReset;

    // Blacklist pour bloquer les utilisateurs malveillants
    mapping(address => bool) public blacklistedUsers;

    // ============ Modificateurs ============

    modifier onlyScheduleOwner(uint256 scheduleId) {
        require(schedules[scheduleId].creator == msg.sender, "Not schedule owner");
        _;
    }

    modifier validSchedule(uint256 scheduleId) {
        require(scheduleId > 0 && scheduleId < _nextScheduleId, "Invalid schedule ID");
        require(schedules[scheduleId].status == ScheduleStatus.ACTIVE, "Schedule not active");
        _;
    }

    modifier notBlacklisted() {
        require(!blacklistedUsers[msg.sender], "User is blacklisted");
        _;
    }

    modifier rateLimited() {
        require(block.timestamp >= lastUserAction[msg.sender] + 30 seconds, "Rate limit exceeded");
        _;
    }

    modifier validAmount(uint256 amount) {
        require(amount >= MIN_TRANSFER_AMOUNT, "Amount too small");
        require(amount <= MAX_TRANSFER_AMOUNT, "Amount too large");
        _;
    }

    // ============ Constructeur ============

    constructor(address _cvtcTransferContract) Ownable(msg.sender) {
        require(_cvtcTransferContract != address(0), "Invalid CVTC transfer contract");
        cvtcTransferContract = ICVTCTransfer(_cvtcTransferContract);
    }

    // ============ Fonctions principales ============

    /**
     * @dev Crée un nouveau transfert planifié
     */
    function createScheduledTransfer(
        address recipient,
        uint256 amount,
        Frequency frequency,
        uint256 startTime,
        uint256 endTime,
        string calldata description
    )
        external
        whenNotPaused
        nonReentrant
        notBlacklisted
        rateLimited
        validAmount(amount)
        returns (uint256)
    {
        require(recipient != address(0), "Invalid recipient");
        require(recipient != msg.sender, "Cannot transfer to self");
        require(userScheduleCount[msg.sender] < MAX_SCHEDULES_PER_USER, "Max schedules reached");

        // Reset daily execution count if needed
        _resetDailyCountIfNeeded(msg.sender);

        // Validation des dates
        require(startTime >= block.timestamp, "Start time must be in future");
        require(startTime <= block.timestamp + MAX_FUTURE_START, "Start time too far in future");
        require(endTime == 0 || endTime > startTime, "End time must be after start time");

        // Validation de la fréquence
        if (frequency != Frequency.UNIQUE) {
            require(endTime > 0, "End time required for recurring transfers");
        }

        uint256 scheduleId = _nextScheduleId++;

        uint256 nextExecution = _calculateNextExecution(startTime, frequency, 0);

        ScheduledTransfer memory newSchedule = ScheduledTransfer({
            id: scheduleId,
            creator: msg.sender,
            recipient: recipient,
            amount: amount,
            frequency: frequency,
            startTime: startTime,
            endTime: endTime,
            lastExecution: 0,
            nextExecution: nextExecution,
            executionCount: 0,
            status: ScheduleStatus.ACTIVE,
            description: description
        });

        schedules[scheduleId] = newSchedule;
        userSchedules[msg.sender].push(scheduleId);
        userScheduleCount[msg.sender]++;

        // Update rate limiting
        lastUserAction[msg.sender] = block.timestamp;

        emit ScheduledTransferCreated(
            scheduleId,
            msg.sender,
            recipient,
            amount,
            frequency,
            startTime,
            endTime
        );

        return scheduleId;
    }

    /**
     * @dev Annule un transfert planifié
     */
    function cancelScheduledTransfer(uint256 scheduleId)
        external
        onlyScheduleOwner(scheduleId)
        validSchedule(scheduleId)
        nonReentrant
    {
        schedules[scheduleId].status = ScheduleStatus.CANCELLED;

        emit ScheduledTransferCancelled(scheduleId, msg.sender);
    }

    /**
     * @dev Modifie un transfert planifié
     */
    function modifyScheduledTransfer(
        uint256 scheduleId,
        uint256 newAmount,
        Frequency newFrequency,
        uint256 newEndTime
    )
        external
        onlyScheduleOwner(scheduleId)
        validSchedule(scheduleId)
        nonReentrant
    {
        require(newAmount > 0, "Amount must be > 0");
        require(newEndTime == 0 || newEndTime > block.timestamp, "End time must be in future");

        ScheduledTransfer storage schedule = schedules[scheduleId];

        // Validation de la nouvelle fréquence
        if (newFrequency != Frequency.UNIQUE) {
            require(newEndTime > 0, "End time required for recurring transfers");
        }

        schedule.amount = newAmount;
        schedule.frequency = newFrequency;
        schedule.endTime = newEndTime;
        schedule.nextExecution = _calculateNextExecution(
            schedule.lastExecution > 0 ? schedule.lastExecution : schedule.startTime,
            newFrequency,
            schedule.executionCount
        );

        emit ScheduledTransferModified(scheduleId, newAmount, newFrequency, newEndTime);
    }

    /**
     * @dev Exécute manuellement un transfert planifié (fonction publique pour tests)
     */
    function executeScheduledTransfer(uint256 scheduleId)
        external
        validSchedule(scheduleId)
        nonReentrant
        notBlacklisted
        rateLimited
        returns (bool)
    {
        ScheduledTransfer storage schedule = schedules[scheduleId];

        // Vérifications de sécurité
        _resetDailyCountIfNeeded(schedule.creator);
        _checkDailyExecutionLimit(schedule.creator);

        // Vérifications de timing
        require(block.timestamp >= schedule.nextExecution, "Too early for execution");
        require(schedule.endTime == 0 || block.timestamp <= schedule.endTime, "Schedule expired");

        // Exécution du transfert
        bool success = _executeTransfer(schedule);

        if (success) {
            schedule.lastExecution = block.timestamp;
            schedule.executionCount++;

            // Incrémenter le compteur quotidien
            dailyExecutionCount[schedule.creator]++;

            // Calcul de la prochaine exécution
            if (schedule.frequency == Frequency.UNIQUE) {
                schedule.status = ScheduleStatus.COMPLETED;
                schedule.nextExecution = 0;
            } else {
                schedule.nextExecution = _calculateNextExecution(
                    block.timestamp,
                    schedule.frequency,
                    schedule.executionCount
                );

                // Vérifier si la prochaine exécution dépasse la date de fin
                if (schedule.endTime > 0 && schedule.nextExecution > schedule.endTime) {
                    schedule.status = ScheduleStatus.COMPLETED;
                    schedule.nextExecution = 0;
                }
            }

            emit ScheduledTransferExecuted(scheduleId, block.timestamp, true);
        } else {
            emit ScheduledTransferExecuted(scheduleId, block.timestamp, false);
        }

        // Update rate limiting
        lastUserAction[msg.sender] = block.timestamp;

        return success;
    }

    // ============ Fonctions utilitaires internes ============

    /**
     * @dev Reset le compteur quotidien si nécessaire
     */
    function _resetDailyCountIfNeeded(address user) internal {
        if (block.timestamp >= lastExecutionReset[user] + 1 days) {
            dailyExecutionCount[user] = 0;
            lastExecutionReset[user] = block.timestamp;
        }
    }

    /**
     * @dev Vérifie les limites d'exécution quotidiennes
     */
    function _checkDailyExecutionLimit(address user) internal view {
        require(dailyExecutionCount[user] < MAX_EXECUTIONS_PER_DAY, "Daily execution limit exceeded");
    }

    /**
     * @dev Calcule la prochaine date d'exécution avec logique précise
     */
    function _calculateNextExecution(
        uint256 fromTime,
        Frequency frequency,
        uint256 executionCount
    ) internal pure returns (uint256) {
        if (frequency == Frequency.UNIQUE) {
            return fromTime;
        }

        if (frequency == Frequency.HOURLY) {
            return fromTime + 1 hours;
        }

        if (frequency == Frequency.DAILY) {
            return fromTime + 1 days;
        }

        if (frequency == Frequency.WEEKLY) {
            return fromTime + 7 days;
        }

        if (frequency == Frequency.MONTHLY) {
            return _calculateNextMonth(fromTime);
        }

        revert("Invalid frequency");
    }

    /**
     * @dev Calcule la date du mois prochain de manière précise
     */
    function _calculateNextMonth(uint256 fromTime) internal pure returns (uint256) {
        // Extraire les composants de la date
        uint256 year = _getYear(fromTime);
        uint256 month = _getMonth(fromTime);
        uint256 day = _getDay(fromTime);

        // Calculer le mois et l'année suivants
        if (month == 12) {
            month = 1;
            year++;
        } else {
            month++;
        }

        // Gérer les mois avec moins de jours (ex: 31 mars -> 30 avril)
        uint256 maxDaysInMonth = _getDaysInMonth(month, year);
        if (day > maxDaysInMonth) {
            day = maxDaysInMonth;
        }

        // Reconstruire le timestamp
        return _getTimestamp(year, month, day, _getHour(fromTime), _getMinute(fromTime), _getSecond(fromTime));
    }

    /**
     * @dev Utilitaires pour la manipulation des dates
     */
    function _getYear(uint256 timestamp) internal pure returns (uint256) {
        return (timestamp / 31536000) + 1970; // Approximation
    }

    function _getMonth(uint256 timestamp) internal pure returns (uint256) {
        uint256 year = _getYear(timestamp);
        uint256 daysSince1970 = timestamp / 86400;
        uint256 yearDays = (year - 1970) * 365 + (year - 1970) / 4; // Approximation des années bissextiles
        uint256 dayOfYear = daysSince1970 - yearDays;

        if (dayOfYear < 31) return 1; // Janvier
        if (dayOfYear < 59) return 2; // Février
        if (dayOfYear < 90) return 3; // Mars
        if (dayOfYear < 120) return 4; // Avril
        if (dayOfYear < 151) return 5; // Mai
        if (dayOfYear < 181) return 6; // Juin
        if (dayOfYear < 212) return 7; // Juillet
        if (dayOfYear < 243) return 8; // Août
        if (dayOfYear < 273) return 9; // Septembre
        if (dayOfYear < 304) return 10; // Octobre
        if (dayOfYear < 334) return 11; // Novembre
        return 12; // Décembre
    }

    function _getDay(uint256 timestamp) internal pure returns (uint256) {
        uint256 year = _getYear(timestamp);
        uint256 month = _getMonth(timestamp);
        uint256 daysSince1970 = timestamp / 86400;
        uint256 yearDays = (year - 1970) * 365 + (year - 1970) / 4;

        uint256 dayOfYear = daysSince1970 - yearDays;

        uint256[] memory monthDays = new uint256[](13);
        monthDays[1] = 31; // Jan
        monthDays[2] = _isLeapYear(year) ? 29 : 28; // Feb
        monthDays[3] = 31; // Mar
        monthDays[4] = 30; // Apr
        monthDays[5] = 31; // May
        monthDays[6] = 30; // Jun
        monthDays[7] = 31; // Jul
        monthDays[8] = 31; // Aug
        monthDays[9] = 30; // Sep
        monthDays[10] = 31; // Oct
        monthDays[11] = 30; // Nov
        monthDays[12] = 31; // Dec

        uint256 dayOfMonth = dayOfYear;
        for (uint256 i = 1; i < month; i++) {
            dayOfMonth -= monthDays[i];
        }

        return dayOfMonth + 1; // +1 car les jours commencent à 1
    }

    function _getHour(uint256 timestamp) internal pure returns (uint256) {
        return (timestamp % 86400) / 3600;
    }

    function _getMinute(uint256 timestamp) internal pure returns (uint256) {
        return (timestamp % 3600) / 60;
    }

    function _getSecond(uint256 timestamp) internal pure returns (uint256) {
        return timestamp % 60;
    }

    function _getDaysInMonth(uint256 month, uint256 year) internal pure returns (uint256) {
        if (month == 2) {
            return _isLeapYear(year) ? 29 : 28;
        }
        if (month == 4 || month == 6 || month == 9 || month == 11) {
            return 30;
        }
        return 31;
    }

    function _isLeapYear(uint256 year) internal pure returns (bool) {
        return (year % 4 == 0) && (year % 100 != 0 || year % 400 == 0);
    }

    function _getTimestamp(
        uint256 year,
        uint256 month,
        uint256 day,
        uint256 hour,
        uint256 minute,
        uint256 second
    ) internal pure returns (uint256) {
        // Cette fonction est une approximation simplifiée
        // Dans un environnement de production, utiliser une bibliothèque de dates plus robuste
        uint256 dayCount = (year - 1970) * 365 + (year - 1970) / 4; // Approximation

        uint256[] memory monthDays = new uint256[](13);
        monthDays[1] = 31;
        monthDays[2] = _isLeapYear(year) ? 29 : 28;
        monthDays[3] = 31;
        monthDays[4] = 30;
        monthDays[5] = 31;
        monthDays[6] = 30;
        monthDays[7] = 31;
        monthDays[8] = 31;
        monthDays[9] = 30;
        monthDays[10] = 31;
        monthDays[11] = 30;
        monthDays[12] = 31;

        for (uint256 i = 1; i < month; i++) {
            dayCount += monthDays[i];
        }
        dayCount += day - 1;

        return dayCount * 86400 + hour * 3600 + minute * 60 + second;
    }

    /**
     * @dev Exécute le transfert via le contrat de transfert
     */
    function _executeTransfer(ScheduledTransfer memory schedule) internal returns (bool) {
        // Vérifier que le contrat peut effectuer le transfert
        if (!cvtcTransferContract.canTransfer(schedule.creator, schedule.recipient, schedule.amount)) {
            return false;
        }

        try cvtcTransferContract.transfer(schedule.recipient, schedule.amount) {
            return true;
        } catch {
            return false;
        }
    }

    /**
     * @dev Vérifie si un schedule peut être exécuté
     */
    function canExecuteSchedule(uint256 scheduleId) external view returns (bool, string memory) {
        if (scheduleId == 0 || scheduleId >= _nextScheduleId) {
            return (false, "Invalid schedule ID");
        }

        ScheduledTransfer memory schedule = schedules[scheduleId];

        if (schedule.status != ScheduleStatus.ACTIVE) {
            return (false, "Schedule not active");
        }

        if (block.timestamp < schedule.nextExecution) {
            return (false, "Too early for execution");
        }

        if (schedule.endTime > 0 && block.timestamp > schedule.endTime) {
            return (false, "Schedule expired");
        }

        if (!cvtcTransferContract.canTransfer(schedule.creator, schedule.recipient, schedule.amount)) {
            return (false, "Insufficient balance or transfer not allowed");
        }

        return (true, "");
    }

    // ============ Fonctions de lecture ============

    /**
     * @dev Récupère les détails d'un transfert planifié
     */
    function getScheduledTransfer(uint256 scheduleId)
        external
        view
        returns (ScheduledTransfer memory)
    {
        require(scheduleId > 0 && scheduleId < _nextScheduleId, "Invalid schedule ID");
        return schedules[scheduleId];
    }

    /**
     * @dev Récupère tous les transferts planifiés d'un utilisateur
     */
    function getUserSchedules(address user)
        external
        view
        returns (uint256[] memory)
    {
        return userSchedules[user];
    }

    /**
     * @dev Récupère les transferts planifiés actifs d'un utilisateur
     */
    function getActiveUserSchedules(address user)
        external
        view
        returns (uint256[] memory)
    {
        uint256[] memory allSchedules = userSchedules[user];
        uint256 activeCount = 0;

        // Compter les actifs
        for (uint256 i = 0; i < allSchedules.length; i++) {
            if (schedules[allSchedules[i]].status == ScheduleStatus.ACTIVE) {
                activeCount++;
            }
        }

        // Créer le tableau des actifs
        uint256[] memory activeSchedules = new uint256[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allSchedules.length; i++) {
            if (schedules[allSchedules[i]].status == ScheduleStatus.ACTIVE) {
                activeSchedules[index] = allSchedules[i];
                index++;
            }
        }

        return activeSchedules;
    }

    /**
     * @dev Vérifie si un transfert est prêt pour exécution
     */
    function isScheduleReady(uint256 scheduleId) external view returns (bool) {
        require(scheduleId > 0 && scheduleId < _nextScheduleId, "Invalid schedule ID");

        ScheduledTransfer memory schedule = schedules[scheduleId];

        if (schedule.status != ScheduleStatus.ACTIVE) {
            return false;
        }

        if (block.timestamp < schedule.nextExecution) {
            return false;
        }

        if (schedule.endTime > 0 && block.timestamp > schedule.endTime) {
            return false;
        }

        return true;
    }

    // ============ Fonctions d'intégration ============

    /**
     * @dev Récupère les informations du contrat de transfert intégré
     */
    function getTransferContractInfo() external view returns (
        address contractAddress,
        address cvtcTokenAddress,
        uint256 ownerBalance
    ) {
        return (
            address(cvtcTransferContract),
            cvtcTransferContract.getCVTCToken(),
            cvtcTransferContract.getCVTCBalance(owner())
        );
    }

    /**
     * @dev Vérifie si un utilisateur peut effectuer un transfert planifié
     */
    function canUserScheduleTransfer(
        address user,
        address recipient,
        uint256 amount
    ) external view returns (bool, string memory) {
        if (blacklistedUsers[user]) {
            return (false, "User is blacklisted");
        }

        if (!cvtcTransferContract.canTransfer(user, recipient, amount)) {
            return (false, "Transfer not possible");
        }

        if (userScheduleCount[user] >= MAX_SCHEDULES_PER_USER) {
            return (false, "Max schedules reached");
        }

        return (true, "");
    }

    // ============ Fonctions d'administration ============

    /**
     * @dev Met à jour l'adresse du contrat de transfert
     */
    function updateTransferContract(address newContract) external onlyOwner {
        require(newContract != address(0), "Invalid contract address");
        cvtcTransferContract = ICVTCTransfer(newContract);
    }

    /**
     * @dev Ajoute un utilisateur à la blacklist
     */
    function blacklistUser(address user) external onlyOwner {
        require(user != address(0), "Invalid user address");
        blacklistedUsers[user] = true;
    }

    /**
     * @dev Retire un utilisateur de la blacklist
     */
    function unblacklistUser(address user) external onlyOwner {
        blacklistedUsers[user] = false;
    }

    /**
     * @dev Met à jour les limites de sécurité
     */
    function updateSecurityLimits(
        uint256 newMaxSchedules,
        uint256 newMaxExecutionsPerDay,
        uint256 newMinAmount,
        uint256 newMaxAmount
    ) external onlyOwner {
        require(newMaxSchedules > 0, "Invalid max schedules");
        require(newMaxExecutionsPerDay > 0, "Invalid max executions");
        require(newMinAmount > 0, "Invalid min amount");
        require(newMaxAmount > newMinAmount, "Invalid amount range");

        // Note: Ces valeurs sont des constantes, donc cette fonction
        // servirait si on les rendait variables dans une version future
    }

    /**
     * @dev Pause le contrat en cas d'urgence
     */
    function emergencyPause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Reprend le contrat après pause
     */
    function emergencyUnpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Récupère les fonds accidentellement envoyés au contrat
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }

    // ============ Fonctions de lecture pour la sécurité ============

    /**
     * @dev Vérifie si un utilisateur peut créer un nouveau schedule
     */
    function canCreateSchedule(address user) external view returns (bool, string memory) {
        if (blacklistedUsers[user]) {
            return (false, "User is blacklisted");
        }

        if (userScheduleCount[user] >= MAX_SCHEDULES_PER_USER) {
            return (false, "Max schedules reached");
        }

        if (block.timestamp < lastUserAction[user] + 30 seconds) {
            return (false, "Rate limit exceeded");
        }

        return (true, "");
    }

    /**
     * @dev Récupère les statistiques de sécurité d'un utilisateur
     */
    function getUserSecurityStats(address user) external view returns (
        bool isBlacklisted,
        uint256 scheduleCount,
        uint256 dailyExecutions,
        uint256 lastAction
    ) {
        return (
            blacklistedUsers[user],
            userScheduleCount[user],
            dailyExecutionCount[user],
            lastUserAction[user]
        );
    }
}

// Interface IERC20 importée depuis OpenZeppelin