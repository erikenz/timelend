"use strict";
const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const hre = require("hardhat");

async function main() {
  const penaltyReceiver = process.env.PENALTY_RECEIVER_ADDRESS;

  if (!penaltyReceiver) {
    throw new Error("Missing PENALTY_RECEIVER_ADDRESS");
  }

  console.log("Deploying TimeLendMVP...");
  console.log("Penalty receiver:", penaltyReceiver);

  const TimeLendMVP = await hre.ethers.getContractFactory("TimeLendMVP");
  const contract = await TimeLendMVP.deploy(penaltyReceiver);

  await contract.waitForDeployment();

  console.log("Contract deployed at:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
