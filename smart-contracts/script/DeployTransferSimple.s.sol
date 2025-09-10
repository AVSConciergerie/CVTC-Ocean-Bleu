// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {CVTCTransferSimple} from "../src/CVTCTransferSimple.sol";

contract DeployTransferSimple is Script {
    function run() external {
        // Clé privée depuis les variables d'environnement
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Adresse du token CVTC
        address cvtcToken = 0x532FC49071656C16311F2f89E6e41C53243355D3;

        vm.startBroadcast(deployerPrivateKey);

        // Déployer le contrat CVTCTransferSimple
        CVTCTransferSimple transferSimple = new CVTCTransferSimple(cvtcToken);

        vm.stopBroadcast();

        // Afficher l'adresse du contrat déployé
        console2.log("CVTCTransferSimple deployed at:", address(transferSimple));
        console2.log("Token CVTC address:", cvtcToken);
    }
}