import pkg from "hardhat";

const { ethers } = pkg;

async function main() {
  const signers = await ethers.getSigners();

  if (signers.length === 0) {
    console.error("No signers configured. Set PRIVATE_KEY in your .env file.");
    process.exit(1);
  }

  const deployer = signers[0];

  console.log("Deploying with account:", deployer.address);
  console.log(
    "Balance:",
    await ethers.formatEther(
      await deployer.provider.getBalance(deployer.address)
    )
  );

  const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD";

  const TimeLendMVP = await ethers.getContractFactory("TimeLendMVP");
  const contract = await TimeLendMVP.connect(deployer).deploy(BURN_ADDRESS);

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log(`TimeLendMVP deployed to: ${address}`);
  console.log(`Burn address set to: ${BURN_ADDRESS}`);
  console.log("Save this address for the frontend!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
