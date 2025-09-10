// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {CVTCTransferSimple} from "../src/CVTCTransferSimple.sol";

contract ApproveAndTransfer is Script {
    function run() external {
        // Configuration
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address smartAccount = 0x71438578893865F0664EdC067B10263c2CF92a1b;
        address recipient = 0x1EdB8DD2C5d6c25B7661316ae57C3E95E0cF6389;
        address cvtcToken = 0x532FC49071656C16311F2f89E6e41C53243355D3;
        address payable transferContract = payable(0xAEfFf843E171A6f022F0D06Bfd85998275a8D2D6);

        uint256 transferAmount = 199 * 10**18; // 199 CVTC

        console2.log("Script Approve + Transfer automatique");
        console2.log("=====================================");
        console2.log("Smart Account:", smartAccount);
        console2.log("Destinataire:", recipient);
        console2.log("Montant:", transferAmount / 10**18, "CVTC");
        console2.log("Token:", cvtcToken);
        console2.log("Contrat:", transferContract);

        vm.startBroadcast(deployerPrivateKey);

        // Etape 1: Verifier l'allowance actuelle
        IERC20 token = IERC20(cvtcToken);
        uint256 currentAllowance = token.allowance(smartAccount, transferContract);
        console2.log("Allowance actuelle:", currentAllowance / 10**18, "CVTC");

        // Etape 2: Approuver si necessaire
        console2.log("Approbation du contrat de transfert...");
        token.approve(transferContract, transferAmount);
        console2.log("Approbation effectuee");

        // Etape 3: Effectuer le transfert
        console2.log("Transfert en cours...");
        CVTCTransferSimple transferSimple = CVTCTransferSimple(transferContract);
        transferSimple.transfer(recipient, transferAmount);
        console2.log("Transfert effectue");

        vm.stopBroadcast();

        console2.log("Script termine avec succes !");
        console2.log("=====================================");
        console2.log("Verifiez sur BSCScan:");
        console2.log("https://testnet.bscscan.com/address/", smartAccount);
    }
}