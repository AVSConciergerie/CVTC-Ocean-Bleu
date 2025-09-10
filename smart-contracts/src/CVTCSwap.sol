// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CVTCSwap is Ownable {
    IERC20 public cvtcToken;
    uint256 public bnbReserve;
    uint256 public cvtcReserve;
    uint256 public constant FEE = 3; // 0.3% fee
    bool public liquidityEnabled = true;
    mapping(address => bool) public whitelisted;
    mapping(address => bool) public ownerBots; // Bots reconnus du owner

    event LiquidityAdded(uint256 bnbAmount, uint256 cvtcAmount);
    event LiquidityRemoved(uint256 bnbAmount, uint256 cvtcAmount);
    event Bought(address buyer, uint256 bnbSpent, uint256 cvtcBought);
    event Sold(address seller, uint256 cvtcSold, uint256 bnbReceived);
    event WhitelistUpdated(address indexed user, bool status);

    constructor(address _cvtcToken) Ownable(msg.sender) {
        cvtcToken = IERC20(_cvtcToken);
    }

    // Fonction pour obtenir les réserves (pour test)
    function getReserves() external view returns (uint256, uint256) {
        return (bnbReserve, cvtcReserve);
    }

    // Toggle pour activer/désactiver la liquidité (seul owner)
    function toggleLiquidity() external onlyOwner {
        liquidityEnabled = !liquidityEnabled;
    }

    // Ajouter/retirer de la whitelist (seul owner)
    function updateWhitelist(address user, bool status) external onlyOwner {
        whitelisted[user] = status;
        emit WhitelistUpdated(user, status);
    }

    // Ajouter/retirer des bots du owner (seul owner)
    function updateOwnerBot(address bot, bool status) external onlyOwner {
        ownerBots[bot] = status;
        emit WhitelistUpdated(bot, status); // Réutilise l'event
    }

    // Ajout de liquidité par le propriétaire
    function addLiquidity(uint256 cvtcAmount) external payable onlyOwner {
        require(liquidityEnabled, "Liquidite desactivee");
        require(msg.value > 0 && cvtcAmount > 0, "Montants non valides");
        require(cvtcToken.transferFrom(msg.sender, address(this), cvtcAmount), "Transfert CVTC echoue");

        if (bnbReserve == 0 && cvtcReserve == 0) {
            // Liquidité initiale
            bnbReserve = msg.value;
            cvtcReserve = cvtcAmount;
        } else {
            // Vérifier le ratio pour maintenir le prix
            require(msg.value * cvtcReserve == cvtcAmount * bnbReserve, "Ratio de liquidite incorrect");
            bnbReserve += msg.value;
            cvtcReserve += cvtcAmount;
        }

        emit LiquidityAdded(msg.value, cvtcAmount);
    }

    // Retrait de liquidité par le propriétaire
    function removeLiquidity(uint256 bnbAmount, uint256 cvtcAmount) external onlyOwner {
        require(liquidityEnabled, "Liquidite desactivee");
        require(bnbAmount <= bnbReserve && cvtcAmount <= cvtcReserve, "Liquidite insuffisante");

        bnbReserve -= bnbAmount;
        cvtcReserve -= cvtcAmount;

        payable(msg.sender).transfer(bnbAmount);
        require(cvtcToken.transfer(msg.sender, cvtcAmount), "Transfert CVTC echoue");

        emit LiquidityRemoved(bnbAmount, cvtcAmount);
    }

    // Acheter CVTC avec BNB (AMM avec slippage)
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

    // Vendre CVTC contre BNB (AMM avec slippage)
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

    // Calculer le montant de sortie pour un swap (AMM)
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) external pure returns (uint256) {
        require(amountIn > 0, "Montant d'entree nul");
        uint256 amountInWithFee = amountIn * (1000 - FEE);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 1000 + amountInWithFee;
        return numerator / denominator;
    }

    // Permet de recevoir BNB
    receive() external payable {
        bnbReserve += msg.value;
    }
}