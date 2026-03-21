const hre = require("hardhat");

async function main() {
  console.log("Deploying contract...");

  const TimeLendMVP = await hre.ethers.getContractFactory("TimeLendMVP");
  const contract = await TimeLendMVP.deploy();

  await contract.waitForDeployment();

  console.log("Contrato deployado en:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});