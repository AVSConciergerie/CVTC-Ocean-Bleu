import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";

// Use require for dotenv for robustness in ts-node environments
require('dotenv').config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      accounts: [process.env.PRIVATE_KEY || ""],
    },
    // Pimlico bundler network for account abstraction
    pimlico: {
      url: process.env.PIMLICO_RPC_URL || "https://api.pimlico.io/v2/97/rpc?apikey=pim_32ESGpGsTSAn7VVUj7Frd7",
      chainId: 97,
      accounts: [process.env.PRIVATE_KEY || ""],
    },
  },
  etherscan: {
    // Use the simpler, direct apiKey format
    apiKey: process.env.BSCSCAN_API_KEY || ""
  },
};

export default config;
