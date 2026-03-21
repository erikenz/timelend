const hre = require("hardhat");

async function main() {
  const contractAddress = "0xA623e22d1bba18084822806b485C0b74684A29E6";

  const contract = await hre.ethers.getContractAt(
    "TimeLendMVP",
    contractAddress
  );

  const commitmentId = (await contract.nextCommitmentId()) - 1n;
    console.log("Usando ID:", commitmentId.toString());

  const [signer] = await hre.ethers.getSigners();
  console.log("Signer:", signer.address);

  // 👇 DEBUG
  // const c = await contract.getCommitment(commitmentId);

  // console.log("Commitment:", {
    // user: c.user,
    // verifier: c.verifier,
    //status: c.status,
    //deadline: c.deadline.toString(),
    //createdAt: c.createdAt.toString(),
  //});

  console.log("Enviando proof...");

  const tx = await contract.submitProof(
    commitmentId,
    "https://mi-proof.com/evidencia.png"
  );

  console.log("TX:", tx.hash);

  await tx.wait();

  console.log("Proof enviada");
}

main().catch(console.error);