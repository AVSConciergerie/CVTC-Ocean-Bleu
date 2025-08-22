import { expect } from "chai";
import { ethers } from "hardhat";

describe("Lock Contract", function () {
  it("Should deploy the contract successfully", async function () {
    // Get the ContractFactory
    const Lock = await ethers.getContractFactory("Lock");

    // Set an unlock time in the future (e.g., 1 hour from now)
    const ONE_HOUR_IN_SECS = 60 * 60;
    const unlockTime = (Math.floor(Date.now() / 1000)) + ONE_HOUR_IN_SECS;

    // Deploy the contract with a dummy value
    const lockContract = await Lock.deploy(unlockTime, { value: 1 });

    // Wait for the deployment to be confirmed
    await lockContract.deployed();

    // Check if the contract has a valid address, which confirms deployment
    expect(lockContract.address).to.be.a('string').and.not.to.be.empty;
  });
});
