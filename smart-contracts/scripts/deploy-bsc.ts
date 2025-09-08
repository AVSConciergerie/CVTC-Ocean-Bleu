import { ethers } from "hardhat";

async function main() {
  console.log("Deploying CVTCSwap contract to BSC Testnet...");
  const CVTCSwap = await ethers.getContractFactory("CVTCSwap");

  // Adresse du token CVTC (à définir dans .env ou ici)
  const cvtcAddress = process.env.CVTC_ADDRESS || "0x..."; // Remplacer par l'adresse réelle

  const cvtcSwap = await CVTCSwap.deploy(cvtcAddress);

  await cvtcSwap.deployed();

  console.log(`CVTCSwap deployed to ${cvtcSwap.address} on BSC Testnet`);
  console.log(`You can check the transaction on https://testnet.bscscan.com/address/${cvtcSwap.address}`);
  console.log(`To verify the contract, run:`);
  console.log(`npx hardhat verify --network bscTestnet ${cvtcSwap.address} "${cvtcAddress}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
