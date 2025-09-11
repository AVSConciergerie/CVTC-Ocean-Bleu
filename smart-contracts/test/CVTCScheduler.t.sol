// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/CVTCScheduler.sol";
import "../src/ICVTCTransfer.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

// Token ERC20 simple pour les tests
contract TestToken is ERC20 {
    constructor() ERC20("Test CVTC", "TCVTC") {
        _mint(msg.sender, 1000000 * 10**18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

// Mock contract pour simuler ICVTCTransfer
contract MockCVTCTransfer is ICVTCTransfer {
    TestToken public cvtcToken;
    mapping(address => bool) public transferAllowed;

    constructor(address _cvtcToken) {
        cvtcToken = TestToken(_cvtcToken);
    }

    function transfer(address receiver, uint256 amount) external returns (bool) {
        require(transferAllowed[msg.sender], "Transfer not allowed");
        require(cvtcToken.balanceOf(msg.sender) >= amount, "Insufficient balance");
        return cvtcToken.transferFrom(msg.sender, receiver, amount);
    }

    function canTransfer(address sender, address receiver, uint256 amount) external view returns (bool) {
        return transferAllowed[sender] && cvtcToken.balanceOf(sender) >= amount;
    }

    function getCVTCBalance(address account) external view returns (uint256) {
        return cvtcToken.balanceOf(account);
    }

    function getCVTCToken() external view returns (address) {
        return address(cvtcToken);
    }

    // Fonctions pour les tests
    function setTransferAllowed(address user, bool allowed) external {
        transferAllowed[user] = allowed;
    }

    function mint(address to, uint256 amount) external {
        // Dans un vrai test, on utiliserait une fonction mint du token
    }
}

contract CVTCSchedulerTest is Test {
    CVTCScheduler public scheduler;
    MockCVTCTransfer public mockTransfer;
    ERC20 public cvtcToken;

    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);
    address public recipient = address(4);

    uint256 public constant INITIAL_BALANCE = 10000 * 10**18; // 10,000 CVTC

    // Helper pour reset le rate limiting
    function resetRateLimit(address user) internal {
        vm.warp(block.timestamp + 31 seconds);
    }

    function setUp() public {
        // Déployer le token CVTC mock
        cvtcToken = new TestToken();

        // Déployer le mock transfer contract
        mockTransfer = new MockCVTCTransfer(address(cvtcToken));

        // Déployer le scheduler
        vm.prank(owner);
        scheduler = new CVTCScheduler(address(mockTransfer));

        // Setup des comptes de test - le token est déjà minté dans le constructeur
        // Transfert des tokens aux utilisateurs de test
        vm.prank(address(this));
        cvtcToken.transfer(user1, INITIAL_BALANCE);
        vm.prank(address(this));
        cvtcToken.transfer(user2, INITIAL_BALANCE);

        // Autoriser les transferts pour les utilisateurs de test
        mockTransfer.setTransferAllowed(user1, true);
        mockTransfer.setTransferAllowed(user2, true);

        // Approuver le mockTransfer pour dépenser les tokens
        vm.prank(user1);
        cvtcToken.approve(address(mockTransfer), INITIAL_BALANCE);
        vm.prank(user2);
        cvtcToken.approve(address(mockTransfer), INITIAL_BALANCE);
    }

    // ============ Tests de création ============

    function testCreateScheduledTransfer() public {
        vm.prank(user1);
        resetRateLimit(user1);

        uint256 startTime = block.timestamp + 1 hours;
        uint256 endTime = startTime + 24 hours;

        uint256 scheduleId = scheduler.createScheduledTransfer(
            recipient,
            100 * 10**18, // 100 CVTC
            CVTCScheduler.Frequency.DAILY,
            startTime,
            endTime,
            "Test transfer"
        );

        assertEq(scheduleId, 1);

        // Vérifier les détails du schedule
        CVTCScheduler.ScheduledTransfer memory scheduleDetails = scheduler.getScheduledTransfer(scheduleId);
        uint256 id = scheduleDetails.id;
        address creator = scheduleDetails.creator;
        address rec = scheduleDetails.recipient;
        uint256 amount = scheduleDetails.amount;
        CVTCScheduler.Frequency freq = scheduleDetails.frequency;
        uint256 sTime = scheduleDetails.startTime;
        uint256 eTime = scheduleDetails.endTime;
        string memory desc = scheduleDetails.description;

        assertEq(id, 1);
        assertEq(creator, user1);
        assertEq(rec, recipient);
        assertEq(amount, 100 * 10**18);
        assertEq(uint(freq), uint(CVTCScheduler.Frequency.DAILY));
        assertEq(sTime, startTime);
        assertEq(eTime, endTime);
        assertEq(desc, "Test transfer");
    }

    function testCreateUniqueTransfer() public {
        vm.prank(user1);

        uint256 startTime = block.timestamp + 1 hours;

        uint256 scheduleId = scheduler.createScheduledTransfer(
            recipient,
            50 * 10**18, // 50 CVTC
            CVTCScheduler.Frequency.UNIQUE,
            startTime,
            0, // Pas de fin
            "Unique transfer"
        );

        assertEq(scheduleId, 2);
    }

    function testCannotCreateWithInvalidRecipient() public {
        vm.prank(user1);

        vm.expectRevert("Invalid recipient");
        scheduler.createScheduledTransfer(
            address(0),
            100 * 10**18,
            CVTCScheduler.Frequency.DAILY,
            block.timestamp + 1 hours,
            0,
            "Test"
        );
    }

    function testCannotCreateWithPastStartTime() public {
        vm.prank(user1);

        vm.expectRevert("Start time must be in future");
        scheduler.createScheduledTransfer(
            recipient,
            100 * 10**18,
            CVTCScheduler.Frequency.DAILY,
            block.timestamp - 1 hours,
            0,
            "Test"
        );
    }

    function testCannotCreateTooManySchedules() public {
        // Créer le maximum de schedules permis
        vm.startPrank(user1);
        for (uint256 i = 0; i < scheduler.MAX_SCHEDULES_PER_USER(); i++) {
            scheduler.createScheduledTransfer(
                recipient,
                1 * 10**18,
                CVTCScheduler.Frequency.UNIQUE,
                block.timestamp + 1 hours + i * 1 hours,
                0,
                "Test"
            );
        }
        vm.stopPrank();

        // Le prochain devrait échouer
        vm.prank(user1);
        vm.expectRevert("Max schedules reached");
        scheduler.createScheduledTransfer(
            recipient,
            1 * 10**18,
            CVTCScheduler.Frequency.UNIQUE,
            block.timestamp + 100 hours,
            0,
            "Test"
        );
    }

    // ============ Tests d'exécution ============

    function testExecuteScheduledTransfer() public {
        // Créer un schedule
        vm.prank(user1);
        uint256 scheduleId = scheduler.createScheduledTransfer(
            recipient,
            100 * 10**18,
            CVTCScheduler.Frequency.UNIQUE,
            block.timestamp + 1 hours,
            0,
            "Test execution"
        );

        // Avancer le temps
        vm.warp(block.timestamp + 1 hours + 1);

        // Exécuter le transfert
        bool success = scheduler.executeScheduledTransfer(scheduleId);
        assertTrue(success);

        // Vérifier que le schedule est marqué comme complété
        CVTCScheduler.ScheduledTransfer memory scheduleDetails8 = scheduler.getScheduledTransfer(scheduleId);
        assertEq(scheduleDetails8.executionCount, 1);
        assertEq(uint(scheduleDetails8.status), uint(CVTCScheduler.ScheduleStatus.COMPLETED));
    }

    function testCannotExecuteTooEarly() public {
        // Créer un schedule
        vm.prank(user1);
        uint256 scheduleId = scheduler.createScheduledTransfer(
            recipient,
            100 * 10**18,
            CVTCScheduler.Frequency.UNIQUE,
            block.timestamp + 2 hours,
            0,
            "Test early execution"
        );

        // Tenter d'exécuter trop tôt
        vm.expectRevert("Too early for execution");
        scheduler.executeScheduledTransfer(scheduleId);
    }

    function testExecuteRecurringTransfer() public {
        // Créer un schedule horaire
        vm.prank(user1);
        uint256 scheduleId = scheduler.createScheduledTransfer(
            recipient,
            50 * 10**18,
            CVTCScheduler.Frequency.HOURLY,
            block.timestamp + 1 hours,
            block.timestamp + 3 hours, // 2 exécutions
            "Recurring test"
        );

        // Première exécution
        vm.warp(block.timestamp + 1 hours + 1);
        bool success1 = scheduler.executeScheduledTransfer(scheduleId);
        assertTrue(success1);

        // Vérifier que la prochaine exécution est planifiée
        CVTCScheduler.ScheduledTransfer memory scheduleDetails2 = scheduler.getScheduledTransfer(scheduleId);
        assertEq(scheduleDetails2.executionCount, 1);
        assertEq(scheduleDetails2.nextExecution, block.timestamp + 1 hours);

        // Deuxième exécution
        vm.warp(block.timestamp + 1 hours);
        bool success2 = scheduler.executeScheduledTransfer(scheduleId);
        assertTrue(success2);

        // Vérifier que c'est terminé
        CVTCScheduler.ScheduledTransfer memory scheduleDetails3 = scheduler.getScheduledTransfer(scheduleId);
        assertEq(scheduleDetails3.executionCount, 2);
        assertEq(uint(scheduleDetails3.status), uint(CVTCScheduler.ScheduleStatus.COMPLETED));
    }

    // ============ Tests d'annulation ============

    function testCancelScheduledTransfer() public {
        // Créer un schedule
        vm.prank(user1);
        uint256 scheduleId = scheduler.createScheduledTransfer(
            recipient,
            100 * 10**18,
            CVTCScheduler.Frequency.DAILY,
            block.timestamp + 1 hours,
            0,
            "Test cancel"
        );

        // Annuler
        vm.prank(user1);
        scheduler.cancelScheduledTransfer(scheduleId);

        // Vérifier le statut
        CVTCScheduler.ScheduledTransfer memory scheduleDetails4 = scheduler.getScheduledTransfer(scheduleId);
        assertEq(uint(scheduleDetails4.status), uint(CVTCScheduler.ScheduleStatus.CANCELLED));
    }

    function testCannotCancelOthersSchedule() public {
        // Créer un schedule avec user1
        vm.prank(user1);
        uint256 scheduleId = scheduler.createScheduledTransfer(
            recipient,
            100 * 10**18,
            CVTCScheduler.Frequency.DAILY,
            block.timestamp + 1 hours,
            0,
            "Test cancel"
        );

        // Tenter d'annuler avec user2
        vm.prank(user2);
        vm.expectRevert("Not schedule owner");
        scheduler.cancelScheduledTransfer(scheduleId);
    }

    // ============ Tests de modification ============

    function testModifyScheduledTransfer() public {
        // Créer un schedule
        vm.prank(user1);
        uint256 scheduleId = scheduler.createScheduledTransfer(
            recipient,
            100 * 10**18,
            CVTCScheduler.Frequency.DAILY,
            block.timestamp + 1 hours,
            0,
            "Test modify"
        );

        // Modifier
        vm.prank(user1);
        scheduler.modifyScheduledTransfer(
            scheduleId,
            200 * 10**18, // Nouveau montant
            CVTCScheduler.Frequency.WEEKLY, // Nouvelle fréquence
            block.timestamp + 1 weeks // Nouvelle fin
        );

        // Vérifier les modifications
        CVTCScheduler.ScheduledTransfer memory scheduleDetails5 = scheduler.getScheduledTransfer(scheduleId);
        assertEq(scheduleDetails5.amount, 200 * 10**18);
        assertEq(uint(scheduleDetails5.frequency), uint(CVTCScheduler.Frequency.WEEKLY));
        assertEq(scheduleDetails5.endTime, block.timestamp + 1 weeks);
    }

    // ============ Tests de sécurité ============

    function testRateLimiting() public {
        vm.prank(user1);
        scheduler.createScheduledTransfer(
            recipient,
            10 * 10**18,
            CVTCScheduler.Frequency.UNIQUE,
            block.timestamp + 1 hours,
            0,
            "Test rate limit"
        );

        // Tenter de créer un autre schedule immédiatement
        vm.prank(user1);
        vm.expectRevert("Rate limit exceeded");
        scheduler.createScheduledTransfer(
            recipient,
            10 * 10**18,
            CVTCScheduler.Frequency.UNIQUE,
            block.timestamp + 2 hours,
            0,
            "Test rate limit 2"
        );
    }

    function testBlacklist() public {
        // Blacklister user2
        vm.prank(owner);
        scheduler.blacklistUser(user2);

        // user2 ne peut plus créer de schedule
        vm.prank(user2);
        vm.expectRevert("User is blacklisted");
        scheduler.createScheduledTransfer(
            recipient,
            10 * 10**18,
            CVTCScheduler.Frequency.UNIQUE,
            block.timestamp + 1 hours,
            0,
            "Test blacklist"
        );
    }

    function testAmountLimits() public {
        vm.prank(user1);

        // Trop petit
        vm.expectRevert("Amount too small");
        scheduler.createScheduledTransfer(
            recipient,
            0.001 ether, // 0.001 CVTC, en dessous du minimum
            CVTCScheduler.Frequency.UNIQUE,
            block.timestamp + 1 hours,
            0,
            "Test min amount"
        );

        // Trop grand
        vm.expectRevert("Amount too large");
        scheduler.createScheduledTransfer(
            recipient,
            20000 ether, // 20,000 CVTC, au dessus du maximum
            CVTCScheduler.Frequency.UNIQUE,
            block.timestamp + 1 hours,
            0,
            "Test max amount"
        );
    }

    // ============ Tests des fréquences ============

    function testMonthlyFrequency() public {
        vm.prank(user1);

        // Créer un schedule mensuel
        uint256 startTime = block.timestamp + 1 hours;
        uint256 scheduleId = scheduler.createScheduledTransfer(
            recipient,
            100 * 10**18,
            CVTCScheduler.Frequency.MONTHLY,
            startTime,
            0,
            "Monthly test"
        );

        // Vérifier la prochaine exécution (devrait être dans ~30 jours)
        CVTCScheduler.ScheduledTransfer memory scheduleDetails6 = scheduler.getScheduledTransfer(scheduleId);
        assertEq(scheduleDetails6.nextExecution, startTime + 30 days);
    }

    function testWeeklyFrequency() public {
        vm.prank(user1);

        uint256 startTime = block.timestamp + 1 hours;
        uint256 scheduleId = scheduler.createScheduledTransfer(
            recipient,
            100 * 10**18,
            CVTCScheduler.Frequency.WEEKLY,
            startTime,
            0,
            "Weekly test"
        );

        CVTCScheduler.ScheduledTransfer memory scheduleDetails7 = scheduler.getScheduledTransfer(scheduleId);
        assertEq(scheduleDetails7.nextExecution, startTime + 7 days);
    }

    // ============ Tests d'intégration ============

    function testIntegrationWithTransferContract() public {
        // Vérifier que le scheduler peut interagir avec le contrat de transfert
        (address contractAddr, address tokenAddr, ) = scheduler.getTransferContractInfo();

        assertEq(contractAddr, address(mockTransfer));
        assertEq(tokenAddr, address(cvtcToken));
    }

    function testCanUserScheduleTransfer() public {
        (bool canSchedule, string memory reason) = scheduler.canUserScheduleTransfer(user1, recipient, 100 * 10**18);
        assertTrue(canSchedule);
        assertEq(reason, "");

        // Tester avec un utilisateur blacklisté
        vm.prank(owner);
        scheduler.blacklistUser(user2);

        (canSchedule, reason) = scheduler.canUserScheduleTransfer(user2, recipient, 100 * 10**18);
        assertFalse(canSchedule);
        assertEq(reason, "User is blacklisted");
    }

    // ============ Tests d'administration ============

    function testEmergencyPause() public {
        vm.prank(owner);
        scheduler.emergencyPause();

        vm.prank(user1);
        resetRateLimit(user1);
        vm.expectRevert("Pausable: paused");
        scheduler.createScheduledTransfer(
            recipient,
            100 * 10**18,
            CVTCScheduler.Frequency.UNIQUE,
            block.timestamp + 1 hours,
            0,
            "Test pause"
        );
    }

    function testUpdateTransferContract() public {
        address newContract = address(5);

        vm.prank(owner);
        scheduler.updateTransferContract(newContract);

        (address updatedAddr, , ) = scheduler.getTransferContractInfo();
        assertEq(updatedAddr, newContract);
    }

    function testOnlyOwnerFunctions() public {
        vm.prank(user1);
        vm.expectRevert(); // Erreur OpenZeppelin v5
        scheduler.emergencyPause();

        vm.prank(user1);
        vm.expectRevert(); // Erreur OpenZeppelin v5
        scheduler.blacklistUser(user2);
    }
}