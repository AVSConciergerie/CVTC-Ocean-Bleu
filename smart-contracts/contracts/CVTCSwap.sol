// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CVTCSwap is Ownable, ReentrancyGuard {
    IERC20 public cvtcToken;
    uint256 public bnbReserve;
    uint256 public cvtcReserve;
    uint256 public constant FEE = 3; // 0.3% fee
    bool public liquidityEnabled = true;
    bool public paused = false;
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

    // Emergency pause/unpause functions
    function pause() external onlyOwner {
        paused = true;
    }

    function unpause() external onlyOwner {
        paused = false;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
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

    // AJOUT DE LIQUIDITÉ PUBLIC (AMM classique)
    function addLiquidityPublic(uint256 cvtcAmount) external payable {
        require(liquidityEnabled, "Liquidite desactivee");
        require(msg.value > 0 && cvtcAmount > 0, "Montants non valides");

        // Transférer les CVTC depuis l'utilisateur vers le contrat
        require(cvtcToken.transferFrom(msg.sender, address(this), cvtcAmount), "Transfert CVTC echoue");

        if (bnbReserve == 0 && cvtcReserve == 0) {
            // Première liquidité - définir le ratio initial
            bnbReserve = msg.value;
            cvtcReserve = cvtcAmount;
        } else {
            // Vérifier le ratio pour maintenir le prix (avec tolérance de 5%)
            uint256 expectedCvtc = (msg.value * cvtcReserve) / bnbReserve;
            uint256 minCvtc = expectedCvtc * 95 / 100; // -5%
            uint256 maxCvtc = expectedCvtc * 105 / 100; // +5%

            require(cvtcAmount >= minCvtc && cvtcAmount <= maxCvtc, "Ratio de liquidite incorrect (+/- 5%)");

            bnbReserve += msg.value;
            cvtcReserve += cvtcAmount;
        }

        emit LiquidityAdded(msg.value, cvtcAmount);
    }

    // Ajout de liquidité par le propriétaire (AMM classique)
    function addLiquidity(uint256 cvtcAmount) external payable onlyOwner whenNotPaused {
        require(liquidityEnabled, "Liquidite desactivee");
        require(msg.value > 0 && cvtcAmount > 0, "Montants non valides");

        // Transférer les CVTC depuis l'owner vers le contrat
        require(cvtcToken.transferFrom(msg.sender, address(this), cvtcAmount), "Transfert CVTC echoue");

        if (bnbReserve == 0 && cvtcReserve == 0) {
            // Première liquidité - définir le ratio initial
            bnbReserve = msg.value;
            cvtcReserve = cvtcAmount;
        } else {
            // Vérifier le ratio pour maintenir le prix (avec tolérance de 5%)
            uint256 expectedCvtc = (msg.value * cvtcReserve) / bnbReserve;
            uint256 minCvtc = expectedCvtc * 95 / 100; // -5%
            uint256 maxCvtc = expectedCvtc * 105 / 100; // +5%

            require(cvtcAmount >= minCvtc && cvtcAmount <= maxCvtc, "Ratio de liquidite incorrect (+/- 5%)");

            bnbReserve += msg.value;
            cvtcReserve += cvtcAmount;
        }

        emit LiquidityAdded(msg.value, cvtcAmount);
    }

    // INITIALISATION AVEC TOKENS EXISTANTS (pour corriger les tokens bloqués)
    function initializeWithExistingTokens(uint256 bnbAmount) external payable onlyOwner {
        require(liquidityEnabled, "Liquidite desactivee");
        require(bnbReserve == 0 && cvtcReserve == 0, "Liquidite deja initialisee");
        require(msg.value == bnbAmount && bnbAmount > 0, "Montant BNB invalide");

        // Vérifier que le contrat a des tokens CVTC
        uint256 contractCvtcBalance = cvtcToken.balanceOf(address(this));
        require(contractCvtcBalance > 0, "Aucun token CVTC dans le contrat");

        // Utiliser les tokens existants pour initialiser les réserves
        bnbReserve = bnbAmount;
        cvtcReserve = contractCvtcBalance;

        emit LiquidityAdded(bnbAmount, contractCvtcBalance);
    }

    // FONCTION D'URGENCE SIMPLIFIÉE (sans BNB initial)
    function emergencyInitialize() external onlyOwner {
        require(liquidityEnabled, "Liquidite desactivee");
        require(bnbReserve == 0 && cvtcReserve == 0, "Liquidite deja initialisee");

        // Vérifier que le contrat a des tokens CVTC
        uint256 contractCvtcBalance = cvtcToken.balanceOf(address(this));
        require(contractCvtcBalance > 0, "Aucun token CVTC dans le contrat");

        // Initialiser seulement avec CVTC (BNB = 0 pour commencer)
        cvtcReserve = contractCvtcBalance;
        bnbReserve = 0;

        emit LiquidityAdded(0, contractCvtcBalance);
    }

    // FONCTION D'URGENCE POUR DÉFINIR LES RÉSERVES MANUELLEMENT
    function emergencySetReserves(uint256 _bnbReserve, uint256 _cvtcReserve) external onlyOwner {
        require(liquidityEnabled, "Liquidite desactivee");

        // Vérifier que les montants correspondent aux balances réelles du contrat
        require(address(this).balance >= _bnbReserve, "BNB insuffisant dans le contrat");
        require(cvtcToken.balanceOf(address(this)) >= _cvtcReserve, "CVTC insuffisant dans le contrat");

        bnbReserve = _bnbReserve;
        cvtcReserve = _cvtcReserve;

        emit LiquidityAdded(_bnbReserve, _cvtcReserve);
    }

    // FONCTION EXCEPTIONNELLE POUR INITIALISATION AVEC TRANSFERT EXTERNE
    function emergencyInitWithTransfer(uint256 _bnbReserve, uint256 _cvtcReserve) external {
        // UNIQUEMENT POUR L'ADRESSE AUTORISÉE (0xFC62525a23197922002F30863Ef7B2d91B6576D0)
        require(msg.sender == 0xFC62525a23197922002F30863Ef7B2d91B6576D0, "Adresse non autorisee");
        require(liquidityEnabled, "Liquidite desactivee");
        require(bnbReserve == 0 && cvtcReserve == 0, "Deja initialise");

        // Vérifier que les montants correspondent aux balances réelles du contrat
        require(address(this).balance >= _bnbReserve, "BNB insuffisant dans le contrat");
        require(cvtcToken.balanceOf(address(this)) >= _cvtcReserve, "CVTC insuffisant dans le contrat");

        bnbReserve = _bnbReserve;
        cvtcReserve = _cvtcReserve;

        emit LiquidityAdded(_bnbReserve, _cvtcReserve);
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
    function buy(uint256 minCvtcOut) external payable whenNotPaused nonReentrant {
        require(whitelisted[msg.sender] || ownerBots[msg.sender] || msg.sender == owner(), "Non autorise");
        require(msg.value > 0, "Pas de BNB envoye");
        require(minCvtcOut > 0, "Montant minimum de sortie invalide");
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

    // Acheter CVTC pour un utilisateur spécifique (AMM avec slippage)
    function buyForUser(address user, uint256 minCvtcOut) external payable {
        require(msg.sender == owner(), "Seul owner peut acheter pour utilisateur");
        require(whitelisted[user] || ownerBots[user], "Utilisateur non autorise");
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

        require(cvtcToken.transfer(user, cvtcAmount), "Transfert CVTC echoue");

        emit Bought(user, msg.value, cvtcAmount);
    }

    // Vendre CVTC contre BNB (AMM avec slippage)
    function sell(uint256 cvtcAmount, uint256 minBnbOut) external whenNotPaused nonReentrant {
        require(whitelisted[msg.sender] || ownerBots[msg.sender] || msg.sender == owner(), "Non autorise");
        require(cvtcAmount > 0, "Montant CVTC nul");
        require(minBnbOut > 0, "Montant minimum de sortie invalide");
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

    // Permet de recevoir BNB (seulement si liquidité activée)
    receive() external payable {
        require(liquidityEnabled, "Liquidite desactivee");
        // Ajouter seulement si c'est un ajout de liquidité intentionnel
        if (bnbReserve > 0 || cvtcReserve > 0) {
            bnbReserve += msg.value;
        }
        // Sinon, garder les fonds sans les ajouter aux réserves
    }
}