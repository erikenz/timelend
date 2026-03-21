const hre = require("hardhat");

async function main() {
  const contractAddress = "0xA623e22d1bba18084822806b485C0b74684A29E6";

  const contract = await hre.ethers.getContractAt(
    "TimeLendMVP",
    contractAddress
  );

  const commitmentId = (await contract.nextCommitmentId()) - 1n;
    console.log("Usando ID:", commitmentId.toString());

  console.log("Verificando success...");

  const tx = await contract.verifySuccess(commitmentId);

  console.log("TX:", tx.hash);

  await tx.wait();

  console.log("Commitment aprobado");
}

main().catch(console.error);