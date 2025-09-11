// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title CVTC ERC-20 Paymaster
 * @notice Paymaster contract that allows users to pay for gas fees using CVTC tokens
 * @dev Based on Pimlico's ERC-20 Paymaster architecture
 */
contract CVTCPaymaster is Ownable {
    using SafeERC20 for IERC20;

    // EntryPoint interface
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

    // Paymaster data structure
    struct PaymasterData {
        address paymaster;
        uint256 paymasterVerificationGasLimit;
        uint256 paymasterPostOpGasLimit;
        bytes paymasterData;
    }

    // Events
    event TokenPaid(address indexed user, uint256 amount, uint256 gasUsed);
    event TokensWithdrawn(address indexed token, address indexed to, uint256 amount);
    event PriceUpdated(address indexed token, uint256 newPrice);

    // State variables
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public tokenPrices; // Price in wei per token unit
    address public immutable entryPoint;
    address public immutable cvtcToken;

    // Constants
    uint256 public constant POST_OP_GAS = 35000;
    uint256 public constant VERIFICATION_GAS = 150000;

    /**
     * @notice Constructor
     * @param _entryPoint Address of the EntryPoint contract
     * @param _cvtcToken Address of the CVTC token
     * @param _owner Owner of the paymaster
     */
    constructor(
        address _entryPoint,
        address _cvtcToken,
        address _owner
    ) Ownable(_owner) {
        entryPoint = _entryPoint;
        cvtcToken = _cvtcToken;

        // Add CVTC as supported token by default
        supportedTokens[_cvtcToken] = true;
        tokenPrices[_cvtcToken] = 1e18; // 1 CVTC = 1 ETH equivalent (adjustable)
    }

    /**
     * @notice Validates the paymaster user operation
     * @param userOp The user operation
     * @param userOpHash Hash of the user operation
     * @param maxCost Maximum cost of the operation
     * @return context Context data
     * @return validationData Validation data
     */
    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external view returns (bytes memory context, uint256 validationData) {
        // Only EntryPoint can call this
        require(msg.sender == entryPoint, "Paymaster: not from entryPoint");

        // Extract paymaster data
        require(userOp.paymasterAndData.length >= 20, "Paymaster: invalid paymasterAndData");

        address token = address(bytes20(userOp.paymasterAndData[0:20]));
        require(supportedTokens[token], "Paymaster: token not supported");

        // Calculate required token amount
        uint256 tokenPrice = tokenPrices[token];
        uint256 requiredTokens = (maxCost * 1e18) / tokenPrice;

        // Check if user has enough tokens
        uint256 userBalance = IERC20(token).balanceOf(userOp.sender);
        require(userBalance >= requiredTokens, "Paymaster: insufficient balance");

        // Return context for postOp
        context = abi.encode(userOp.sender, token, requiredTokens, maxCost);

        // No time-based validation
        validationData = 0;
    }

    /**
     * @notice Executes post-operation logic
     * @param mode Mode of execution (0 = successful, 1 = failed, 2 = reverted)
     * @param context Context data from validatePaymasterUserOp
     * @param actualGasCost Actual gas cost
     */
    function postOp(
        uint8 mode,
        bytes calldata context,
        uint256 actualGasCost
    ) external {
        // Only EntryPoint can call this
        require(msg.sender == entryPoint, "Paymaster: not from entryPoint");

        // Only process successful operations
        if (mode != 0) return;

        // Decode context
        (address user, address token, uint256 requiredTokens, uint256 maxCost) =
            abi.decode(context, (address, address, uint256, uint256));

        // Calculate actual token amount based on actual gas cost
        uint256 tokenPrice = tokenPrices[token];
        uint256 actualTokens = (actualGasCost * 1e18) / tokenPrice;

        // Cap at the maximum required tokens
        if (actualTokens > requiredTokens) {
            actualTokens = requiredTokens;
        }

        // Transfer tokens from user to paymaster
        IERC20(token).safeTransferFrom(user, address(this), actualTokens);

        emit TokenPaid(user, actualTokens, actualGasCost);
    }

    /**
     * @notice Adds support for a new token
     * @param token Address of the token to add
     * @param price Price in wei per token unit
     */
    function addSupportedToken(address token, uint256 price) external onlyOwner {
        supportedTokens[token] = true;
        tokenPrices[token] = price;
        emit PriceUpdated(token, price);
    }

    /**
     * @notice Removes support for a token
     * @param token Address of the token to remove
     */
    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
        delete tokenPrices[token];
    }

    /**
     * @notice Updates the price of a token
     * @param token Address of the token
     * @param newPrice New price in wei per token unit
     */
    function updateTokenPrice(address token, uint256 newPrice) external onlyOwner {
        require(supportedTokens[token], "Paymaster: token not supported");
        tokenPrices[token] = newPrice;
        emit PriceUpdated(token, newPrice);
    }

    /**
     * @notice Withdraws tokens from the paymaster
     * @param token Address of the token to withdraw
     * @param to Address to send tokens to
     * @param amount Amount to withdraw
     */
    function withdrawTokens(address token, address to, uint256 amount) external onlyOwner {
        require(supportedTokens[token], "Paymaster: token not supported");
        IERC20(token).safeTransfer(to, amount);
        emit TokensWithdrawn(token, to, amount);
    }

    /**
     * @notice Gets the paymaster data for a user operation
     * @param token Address of the token to use
     * @return paymasterAndData Encoded paymaster data
     */
    function getPaymasterData(address token) external view returns (bytes memory) {
        require(supportedTokens[token], "Paymaster: token not supported");
        return abi.encodePacked(address(this), uint256(VERIFICATION_GAS), uint256(POST_OP_GAS), token);
    }

    /**
     * @notice Gets the paymaster stub data for gas estimation
     * @param token Address of the token to use
     * @return paymasterAndData Encoded paymaster stub data
     */
    function getPaymasterStubData(address token) external view returns (bytes memory) {
        require(supportedTokens[token], "Paymaster: token not supported");
        return abi.encodePacked(address(this), uint256(VERIFICATION_GAS), uint256(POST_OP_GAS), token);
    }

    /**
     * @notice Gets supported tokens
     * @return tokens Array of supported token addresses
     */
    function getSupportedTokens() external view returns (address[] memory tokens) {
        // This is a simplified implementation. In production, consider using an enumerable set.
        // For now, return known supported tokens
        address[] memory tempTokens = new address[](10); // Adjust size as needed
        uint256 count = 0;

        // Check common tokens (this is not efficient but works for small number of tokens)
        address[10] memory possibleTokens = [
            cvtcToken, // CVTC is always first
            address(0), address(0), address(0), address(0),
            address(0), address(0), address(0), address(0), address(0)
        ];

        for (uint256 i = 0; i < possibleTokens.length; i++) {
            if (possibleTokens[i] != address(0) && supportedTokens[possibleTokens[i]]) {
                tempTokens[count] = possibleTokens[i];
                count++;
            }
        }

        // Copy to properly sized array
        tokens = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            tokens[i] = tempTokens[i];
        }
    }

    /**
     * @notice Gets token quotes for gas payment
     * @param token Address of the token
     * @param gasLimit Gas limit for the operation
     * @return tokenAmount Amount of tokens required
     */
    function getTokenQuote(address token, uint256 gasLimit) external view returns (uint256 tokenAmount) {
        require(supportedTokens[token], "Paymaster: token not supported");

        // Estimate gas cost (simplified)
        uint256 estimatedGasCost = gasLimit * 20 * 1e9; // 20 gwei * gasLimit
        uint256 tokenPrice = tokenPrices[token];

        tokenAmount = (estimatedGasCost * 1e18) / tokenPrice;
    }
}