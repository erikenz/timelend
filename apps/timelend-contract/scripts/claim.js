const hre = require("hardhat");

async function main() {
  const contractAddress = "0xA623e22d1bba18084822806b485C0b74684A29E6";

  const contract = await hre.ethers.getContractAt(
    "TimeLendMVP",
    contractAddress
  );

  const commitmentId = (await contract.nextCommitmentId()) - 1n;
    console.log("Usando ID:", commitmentId.toString());

  console.log("Reclamando fondos...");

  const tx = await contract.claimSuccess(commitmentId);

  console.log("TX:", tx.hash);

  await tx.wait();

  console.log("Fondos reclamados 🎉");
}

main().catch(console.error);