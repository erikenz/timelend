export const CONTRACT_ADDRESS = "0xA623e22d1bba18084822806b485C0b74684A29E6";

export const CONTRACT_ABI = [
  {
    type: "event",
    name: "CommitmentCreated",
    inputs: [
      { indexed: true, name: "commitmentId", type: "uint256" },
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "verifier", type: "address" },
      { indexed: false, name: "penaltyReceiver", type: "address" },
      { indexed: false, name: "stake", type: "uint256" },
      { indexed: false, name: "deadline", type: "uint64" },
      { indexed: false, name: "taskURI", type: "string" },
    ],
  },
  {
    type: "function",
    name: "createCommitment",
    stateMutability: "payable",
    inputs: [
      { name: "durationSeconds", type: "uint64" },
      { name: "verifier", type: "address" },
      { name: "penaltyReceiver", type: "address" },
      { name: "taskURI", type: "string" },
    ],
    outputs: [{ name: "commitmentId", type: "uint256" }],
  },
  {
    type: "function",
    name: "submitProof",
    stateMutability: "nonpayable",
    inputs: [
      { name: "commitmentId", type: "uint256" },
      { name: "proofURI", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "verifySuccess",
    stateMutability: "nonpayable",
    inputs: [{ name: "commitmentId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "claimSuccess",
    stateMutability: "nonpayable",
    inputs: [{ name: "commitmentId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getCommitment",
    stateMutability: "view",
    inputs: [{ name: "commitmentId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "user", type: "address" },
          { name: "verifier", type: "address" },
          { name: "penaltyReceiver", type: "address" },
          { name: "stake", type: "uint256" },
          { name: "createdAt", type: "uint64" },
          { name: "deadline", type: "uint64" },
          { name: "status", type: "uint8" },
          { name: "taskURI", type: "string" },
          { name: "proofURI", type: "string" },
        ],
      },
    ],
  },
] as const;
