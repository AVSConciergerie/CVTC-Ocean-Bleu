import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Lock contract to BSC Testnet...");
  const Lock = await ethers.getContractFactory("Lock");

  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const unlockTime = (Math.floor(Date.now() / 1000)) + ONE_YEAR_IN_SECS;
  const lockedAmount = ethers.utils.parseEther("0.0001"); // Use a small amount for testnet

  const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

  await lock.deployed();

  console.log(`Lock with 0.0001 tBNB deployed to ${lock.address} on BSC Testnet`);
  console.log(`You can check the transaction on https://testnet.bscscan.com/address/${lock.address}`);
  console.log(`To verify the contract, run:`);
  console.log(`npx hardhat verify --network bscTestnet ${lock.address} ${unlockTime}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
