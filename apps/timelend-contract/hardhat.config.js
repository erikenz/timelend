"use strict";
const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("@nomicfoundation/hardhat-toolbox");

const normalizePrivateKey = (value) => {
  if (!value) {
    return undefined;
  }

  return value.startsWith("0x") ? value : `0x${value}`;
};

const privateKey = normalizePrivateKey(process.env.PRIVATE_KEY);
const networks = process.env.FUJI_RPC_URL
  ? {
      fuji: {
        url: process.env.FUJI_RPC_URL,
        accounts: privateKey ? [privateKey] : [],
      },
    }
  : {};

module.exports = {
  solidity: "0.8.24",
  networks,
};
