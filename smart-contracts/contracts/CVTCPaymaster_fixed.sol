// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CVTCPaymaster (Fixed Version)
 * @notice Corrected version of the Paymaster contract.
 * @dev Key changes:
 * - Added `tokenDecimals` mapping to correctly handle different token decimal places.
 * - Corrected the formula in `getTokenQuote` to prevent precision loss.
 * - Updated constructor and `addSupportedToken` to manage token decimals.
 * - Set a more realistic default price for CVTC.
 */
contract CVTCPaymaster_fixed is Ownable {
    using SafeERC20 for IERC20;

    struct UserOperation {
        address sender;
        uint256 nonce;
        bytes initCode;
        bytes callData;
        uint256 callGasLimit;
        uint256 verificationGasLimit;
        uint256 preVerificationGas;
        uint256 maxFeePerGas;
        uint256 maxPriorityFeePerGas;
        bytes paymasterAndData;
        bytes signature;
    }

    event PriceUpdated(address indexed token, uint256 newPrice);
    event TokenPaid(address indexed user, uint256 amount, uint256 gasUsed);

    // State variables
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public tokenPrices; // Price of 1 FULL token in wei
    mapping(address => uint8) public tokenDecimals;   // Decimals for each token

    address public immutable entryPoint;
    address public immutable cvtcToken;

    uint256 public constant POST_OP_GAS = 35000;
    uint256 public constant VERIFICATION_GAS = 150000;

    /**
     * @param _entryPoint Address of the EntryPoint contract
     * @param _cvtcToken Address of the CVTC token
     * @param _cvtcTokenDecimals The number of decimals for the CVTC token (e.g., 2)
     */
    constructor(
        address _entryPoint,
        address _cvtcToken,
        uint8 _cvtcTokenDecimals
    ) Ownable(msg.sender) {
        entryPoint = _entryPoint;
        cvtcToken = _cvtcToken;

        // Add CVTC as a supported token by default with a realistic price
        // Example: 1 BNB = $300, 1 CVTC = $0.10  => 1 BNB = 3000 CVTC
        // Price of 1 CVTC in wei = 1e18 / 3000 = 333333333333333
        uint256 initialPrice = 333333333333333;
        addSupportedToken(_cvtcToken, _cvtcTokenDecimals, initialPrice);
    }

    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external view returns (bytes memory context, uint256 validationData) {
        require(msg.sender == entryPoint, "Paymaster: not from entryPoint");
        require(userOp.paymasterAndData.length >= 20, "Paymaster: invalid paymasterAndData");

        address token = abi.decode(userOp.paymasterAndData[20:], (address));
        require(supportedTokens[token], "Paymaster: token not supported");

        uint256 requiredTokens = getTokenQuote(token, maxCost); // Use the corrected quote function

        uint256 userBalance = IERC20(token).balanceOf(userOp.sender);
        require(userBalance >= requiredTokens, "Paymaster: insufficient balance");

        context = abi.encode(userOp.sender, token, requiredTokens);
        validationData = 0;
    }

    function postOp(
        uint8 mode,
        bytes calldata context,
        uint256 actualGasCost
    ) external {
        require(msg.sender == entryPoint, "Paymaster: not from entryPoint");
        if (mode != 0) return; // Only process successful operations

        (address user, address token, uint256 requiredTokens) = abi.decode(context, (address, address, uint256));

        uint256 actualTokens = getTokenQuote(token, actualGasCost);

        if (actualTokens > requiredTokens) {
            actualTokens = requiredTokens;
        }

        IERC20(token).safeTransferFrom(user, address(this), actualTokens);

        emit TokenPaid(user, actualTokens, actualGasCost);
    }

    /**
     * @notice Adds support for a new token.
     * @param token Address of the token to add.
     * @param decimals The number of decimals the token uses.
     * @param price The price of one FULL unit of the token in wei (e.g., price of 1 CVTC in wei).
     */
    function addSupportedToken(address token, uint8 decimals, uint256 price) public onlyOwner {
        supportedTokens[token] = true;
        tokenDecimals[token] = decimals;
        tokenPrices[token] = price;
        emit PriceUpdated(token, price);
    }

    function updateTokenPrice(address token, uint256 newPrice) external onlyOwner {
        require(supportedTokens[token], "Paymaster: token not supported");
        tokenPrices[token] = newPrice;
        emit PriceUpdated(token, newPrice);
    }

    /**
     * @notice Correctly calculates the required token amount for a given gas cost.
     * @param token Address of the token.
     * @param gasCost The estimated gas cost in wei.
     * @return tokenAmount The required amount in the token's smallest unit.
     */
    function getTokenQuote(address token, uint256 gasCost) public view returns (uint256 tokenAmount) {
        require(supportedTokens[token], "Paymaster: token not supported");

        uint256 price = tokenPrices[token];
        uint8 decimals = tokenDecimals[token];
        require(price > 0, "Paymaster: price for token not set");

        // Formula: amount = (cost_in_wei * 10**decimals) / price_of_one_token_in_wei
        // This scales up the cost before dividing to maintain precision.
        tokenAmount = (gasCost * (10**decimals)) / price;
    }

    function getPaymasterData(address token) external view returns (bytes memory) {
        require(supportedTokens[token], "Paymaster: token not supported");
        // Encode paymaster address and token address for use in validatePaymasterUserOp
        return abi.encode(address(this), token);
    }

    function getPaymasterStubData(address token) external view returns (bytes memory) {
        require(supportedTokens[token], "Paymaster: token not supported");
        // Return the same data for stub, can be optimized if needed
        return abi.encode(address(this), token);
    }

    function withdrawTokens(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }

    receive() external payable {}
}
