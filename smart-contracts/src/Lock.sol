// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// This is a simplified version of the Lock contract for demonstration.
// A full version is available at @openzeppelin/contracts/finance/Lock.sol
contract Lock {
    uint public unlockTime;
    address payable public owner;

    event Withdrawal(uint amount, uint when);

    constructor(uint _unlockTime) payable {
        require(
            block.timestamp < _unlockTime,
            "Unlock time should be in the future"
        );

        unlockTime = _unlockTime;
        owner = payable(msg.sender);
    }

    function withdraw() public {
        require(block.timestamp >= unlockTime, "You can't withdraw yet");
        require(msg.sender == owner, "You aren't the owner");

        emit Withdrawal(address(this).balance, block.timestamp);

        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Transfer failed.");
    }
}
