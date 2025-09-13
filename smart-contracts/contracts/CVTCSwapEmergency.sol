// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CVTCSwapEmergency is Ownable {
    IERC20 public cvtcToken;
    uint256 public bnbReserve;
    uint256 public cvtcReserve;
    uint256 public constant FEE = 3; // 0.3% fee
    bool public liquidityEnabled = true;
    mapping(address => bool) public whitelisted;
    mapping(address => bool) public ownerBots;

    event LiquidityAdded(uint256 bnbAmount, uint256 cvtcAmount);
    event LiquidityRemoved(uint256 bnbAmount, uint256 cvtcAmount);
    event Bought(address buyer, uint256 bnbSpent, uint256 cvtcBought);
    event Sold(address seller, uint256 cvtcSold, uint256 bnbReceived);
    event WhitelistUpdated(address indexed user, bool status);

    constructor(address _cvtcToken) Ownable(msg.sender) {
        cvtcToken = IERC20(_cvtcToken);
    }

    // FONCTION D'URGENCE SIMPLIFIÉE
    function emergencyInitialize() external onlyOwner {
        require(bnbReserve == 0 && cvtcReserve == 0, "Deja initialise");
        uint256 contractBalance = cvtcToken.balanceOf(address(this));
        require(contractBalance > 0, "Aucun CVTC dans le contrat");
        cvtcReserve = contractBalance;
        bnbReserve = 0;
        emit LiquidityAdded(0, contractBalance);
    }

    // AJOUTER BNB APRÈS INITIALISATION
    function addInitialBnb() external payable onlyOwner {
        require(cvtcReserve > 0 && bnbReserve == 0, "Pas encore initialise ou BNB deja ajoute");
        require(msg.value > 0, "Montant BNB requis");
        bnbReserve = msg.value;
        emit LiquidityAdded(msg.value, 0);
    }

    // FONCTIONS STANDARD (comme l'ancien contrat)
    function getReserves() external view returns (uint256, uint256) {
        return (bnbReserve, cvtcReserve);
    }

    function toggleLiquidity() external onlyOwner {
        liquidityEnabled = !liquidityEnabled;
    }

    function updateWhitelist(address user, bool status) external onlyOwner {
        whitelisted[user] = status;
        emit WhitelistUpdated(user, status);
    }

    function updateOwnerBot(address bot, bool status) external onlyOwner {
        ownerBots[bot] = status;
        emit WhitelistUpdated(bot, status);
    }

    function buy(uint256 minCvtcOut) external payable {
        require(whitelisted[msg.sender] || ownerBots[msg.sender] || msg.sender == owner(), "Non autorise");
        require(msg.value > 0, "Pas de BNB envoye");
        require(bnbReserve > 0 && cvtcReserve > 0, "Liquidite non initialisee");

        uint256 amountInWithFee = msg.value * (1000 - FEE);
        uint256 numerator = amountInWithFee * cvtcReserve;
        uint256 denominator = bnbReserve * 1000 + amountInWithFee;
        uint256 cvtcAmount = numerator / denominator;

        require(cvtcAmount >= minCvtcOut, "Slippage: CVTC insuffisant");
        require(cvtcAmount <= cvtcReserve, "Liquidite CVTC insuffisante");

        bnbReserve += msg.value;
        cvtcReserve -= cvtcAmount;

        require(cvtcToken.transfer(msg.sender, cvtcAmount), "Transfert CVTC echoue");

        emit Bought(msg.sender, msg.value, cvtcAmount);
    }

    function sell(uint256 cvtcAmount, uint256 minBnbOut) external {
        require(whitelisted[msg.sender] || ownerBots[msg.sender] || msg.sender == owner(), "Non autorise");
        require(cvtcAmount > 0, "Montant CVTC nul");
        require(bnbReserve > 0 && cvtcReserve > 0, "Liquidite non initialisee");

        uint256 amountInWithFee = cvtcAmount * (1000 - FEE);
        uint256 numerator = amountInWithFee * bnbReserve;
        uint256 denominator = cvtcReserve * 1000 + amountInWithFee;
        uint256 bnbAmount = numerator / denominator;

        require(bnbAmount >= minBnbOut, "Slippage: BNB insuffisant");
        require(bnbAmount <= bnbReserve, "Liquidite BNB insuffisante");
        require(cvtcToken.transferFrom(msg.sender, address(this), cvtcAmount), "Transfert CVTC echoue");

        cvtcReserve += cvtcAmount;
        bnbReserve -= bnbAmount;

        payable(msg.sender).transfer(bnbAmount);

        emit Sold(msg.sender, cvtcAmount, bnbAmount);
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) external pure returns (uint256) {
        require(amountIn > 0, "Montant d'entree nul");
        uint256 amountInWithFee = amountIn * (1000 - FEE);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 1000 + amountInWithFee;
        return numerator / denominator;
    }

    receive() external payable {
        bnbReserve += msg.value;
    }
}