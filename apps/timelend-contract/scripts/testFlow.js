const hre = require("hardhat");

async function main() {
  const contractAddress = "0xA623e22d1bba18084822806b485C0b74684A29E6";

  const [signer] = await hre.ethers.getSigners();

  console.log("Usando wallet:", signer.address);

  const contract = await hre.ethers.getContractAt(
    "TimeLendMVP",
    contractAddress
  );

  console.log("Creando commitment...");

  const tx = await contract.createCommitment(
    3600, // 1 hora
    signer.address, // verifier (vos mismo)
    signer.address, // penaltyReceiver (vos mismo)
    "Estudiar Solidity 1h", // task
    {
      value: hre.ethers.parseEther("0.01"),
    }
  );

  console.log("TX enviada:", tx.hash);

  const receipt = await tx.wait();

  console.log("Confirmada en bloque:", receipt.blockNumber);

  const commitmentId = (await contract.nextCommitmentId()) - 1n;
    console.log("Nuevo commitment ID:", commitmentId.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});