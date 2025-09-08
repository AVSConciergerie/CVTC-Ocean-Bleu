// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IFarm {
    function pendingReward(address) external view returns (uint256);
    function harvest() external;
}

interface IRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);
}

interface ICVTCSwap {
    function addLiquidity(uint256 cvtcAmount) external payable;
}

contract CVTCCompounder is Ownable {
    IFarm public farm;
    IRouter public router;
    IERC20 public rewardToken;
    IERC20 public lpToken;
    IERC20 public cvtcToken;
    address public wbnb;
    ICVTCSwap public cvtcSwap;

    uint256 public lastReinvest;
    uint256 public minPendingReward = 1000000000000000000; // 1 token minimum pour réinvestir automatiquement

    // Mode test pour accélérer les délais
    bool public isTestMode = true;

    function toggleTestMode() external onlyOwner {
        isTestMode = !isTestMode;
    }

    function getMinReinvestDelay() public view returns (uint256) {
        return isTestMode ? 15 seconds : 1 days; // TEST: 15s = 1 jour
    }

    event Reinvested(uint256 rewardHarvested, uint256 cvtcAdded, uint256 bnbAdded);

    constructor(
        address _farm,
        address _router,
        address _rewardToken,
        address _lpToken,
        address _cvtc,
        address _wbnb,
        address _cvtcSwap
    ) Ownable(msg.sender) {
        farm = IFarm(_farm);
        router = IRouter(_router);
        rewardToken = IERC20(_rewardToken);
        lpToken = IERC20(_lpToken);
        cvtcToken = IERC20(_cvtc);
        wbnb = _wbnb;
        cvtcSwap = ICVTCSwap(_cvtcSwap);
    }

    // Fonction de réinvestissement (automatique si récompenses suffisantes)
    function reinvest() external {
        uint256 pending = farm.pendingReward(address(this));
        require(msg.sender == owner() || pending >= minPendingReward, "Non autorise ou recompenses insuffisantes");
        require(pending > 0, "Pas de recompenses");

        // Récolter
        farm.harvest();
        uint256 rewardBalance = rewardToken.balanceOf(address(this));
        require(rewardBalance > 0, "Recompenses non recues");

        // Swap half reward to BNB
        uint256 halfReward = rewardBalance / 2;
        rewardToken.approve(address(router), halfReward);
        address[] memory path = new address[](2);
        path[0] = address(rewardToken);
        path[1] = wbnb;
        uint256[] memory amounts = router.swapExactTokensForTokens(
            halfReward,
            0, // amountOutMin, ajuster selon besoin
            path,
            address(this),
            block.timestamp + 600
        );
        uint256 bnbReceived = amounts[1];

        // Maintenant, cvtc restant et bnbReceived
        uint256 cvtcBalance = rewardToken.balanceOf(address(this)); // Assuming reward is CVTC
        require(cvtcBalance > 0 && bnbReceived > 0, "Balances insuffisantes");

        // Ajouter liquidité à CVTCSwap
        cvtcToken.approve(address(cvtcSwap), cvtcBalance);
        cvtcSwap.addLiquidity{value: bnbReceived}(cvtcBalance);

        lastReinvest = block.timestamp;
        emit Reinvested(rewardBalance, cvtcBalance, bnbReceived);
    }

    // Ajuster le minimum de récompenses pour réinvest automatique (owner only)
    function setMinPendingReward(uint256 _min) external onlyOwner {
        minPendingReward = _min;
    }

    // Fonction pour retirer tokens si besoin (owner only)
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }

    // Recevoir BNB
    receive() external payable {}
}