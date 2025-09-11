// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../contracts/CVTCPaymaster.sol";

/**
 * @title Deploy CVTC Paymaster
 * @notice Deployment script for CVTC ERC-20 Paymaster on BSC Testnet
 */
contract DeployPaymaster is Script {
    // BSC Testnet EntryPoint v0.6 (standard)
    address constant ENTRY_POINT = 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789;

    // CVTC Token address on BSC Testnet
    address constant CVTC_TOKEN = 0x532FC49071656C16311F2f89E6e41C53243355D3;

    // Deployer address (will be set via environment)
    address deployer;

    function setUp() public {
        deployer = vm.envAddress("DEPLOYER_ADDRESS");
        console.log("Deployer address:", deployer);
        console.log("EntryPoint address:", ENTRY_POINT);
        console.log("CVTC Token address:", CVTC_TOKEN);
    }

    function run() public {
        vm.startBroadcast(deployer);

        console.log("Deploying CVTC Paymaster...");

        // Deploy the paymaster
        CVTCPaymaster paymaster = new CVTCPaymaster(
            ENTRY_POINT,
            CVTC_TOKEN,
            deployer // Owner
        );

        console.log("CVTC Paymaster deployed at:", address(paymaster));

        // Verify deployment
        require(address(paymaster) != address(0), "Deployment failed");

        // Log important addresses
        console.log("EntryPoint:", paymaster.entryPoint());
        console.log("CVTC Token:", paymaster.cvtcToken());
        console.log("Owner:", paymaster.owner());

        // Check if CVTC is supported
        bool cvtcSupported = paymaster.supportedTokens(CVTC_TOKEN);
        console.log("CVTC supported:", cvtcSupported);

        // Get CVTC price
        uint256 cvtcPrice = paymaster.tokenPrices(CVTC_TOKEN);
        console.log("CVTC price (wei per token):", cvtcPrice);

        vm.stopBroadcast();

        console.log("Deployment completed successfully!");
        console.log("Paymaster address:", address(paymaster));
    }
}