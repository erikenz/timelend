"use strict";
require("@nomicfoundation/hardhat-toolbox");
require("dotenv/config");

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./src",
  },
  networks: {
    hardhat: {
      chainId: 31_337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    fuji: {
      url:
        process.env.AVALANCHE_FUJI_RPC_URL ||
        "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43_113,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

module.exports = config;
