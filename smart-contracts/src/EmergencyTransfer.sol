// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract EmergencyTransfer {
    IERC20 public cvtcToken;
    address public oldContract;

    constructor(address _cvtcToken, address _oldContract) {
        cvtcToken = IERC20(_cvtcToken);
        oldContract = _oldContract;
    }

    function emergencyTransfer(address user, uint256 amount) external {
        // Vérifier que les tokens sont dans l'ancien contrat
        require(cvtcToken.balanceOf(oldContract) >= amount, "Insufficient tokens in old contract");

        // Appeler le transfert depuis l'ancien contrat
        // Cette fonction doit être appelée par le propriétaire de l'ancien contrat
        (bool success,) = oldContract.call(
            abi.encodeWithSignature("emergencyCVTCReturn(address,uint256)", user, amount)
        );

        if (!success) {
            // Si la fonction n'existe pas, essayer un transfert direct
            // (Cela nécessiterait que l'ancien contrat approuve ce contrat)
            revert("Emergency transfer failed");
        }
    }

    // Fonction de secours si l'ancien contrat peut transférer directement
    function directTransfer(address user, uint256 amount) external {
        require(msg.sender == oldContract, "Only old contract can call");
        require(cvtcToken.transfer(user, amount), "Transfer failed");
    }
}