export const CONTRACT_ADDRESS = "0xA623e22d1bba18084822806b485C0b74684A29E6";

export const CONTRACT_ABI = [
  {
    name: "createCommitment",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "durationSeconds", type: "uint64" },
      { name: "verifier", type: "address" },
      { name: "penaltyReceiver", type: "address" },
      { name: "taskURI", type: "string" }
    ],
    outputs: [{ type: "uint256" }]
  }
];