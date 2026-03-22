export const TIME_LEND_CONTRACT_ADDRESS =
  "0x5192258383C8cc29571e57697eAD535b96535bdE" as const;

export const TIME_LEND_CHAIN = {
  blockExplorerUrl: "https://testnet.snowtrace.io",
  chainId: 43_113,
  chainName: "Avalanche Fuji",
} as const;

export const TIME_LEND_CONTRACT_ABI = [
  {
    type: "event",
    name: "CommitmentCreated",
    inputs: [
      { indexed: true, name: "commitmentId", type: "uint256" },
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "penaltyReceiver", type: "address" },
      { indexed: false, name: "stake", type: "uint256" },
      { indexed: false, name: "deadline", type: "uint64" },
      { indexed: false, name: "taskDescription", type: "string" },
    ],
  },
  {
    type: "event",
    name: "CommitmentResolved",
    inputs: [
      { indexed: true, name: "commitmentId", type: "uint256" },
      { indexed: false, name: "passed", type: "bool" },
      { indexed: true, name: "recipient", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "createCommitment",
    stateMutability: "payable",
    inputs: [
      { name: "durationSeconds", type: "uint64" },
      { name: "taskDescription", type: "string" },
    ],
    outputs: [{ name: "commitmentId", type: "uint256" }],
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
          { name: "penaltyReceiver", type: "address" },
          { name: "stake", type: "uint256" },
          { name: "createdAt", type: "uint64" },
          { name: "deadline", type: "uint64" },
          { name: "status", type: "uint8" },
          { name: "taskDescription", type: "string" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "resolveCommitment",
    stateMutability: "nonpayable",
    inputs: [
      { name: "commitmentId", type: "uint256" },
      { name: "passed", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "defaultPenaltyReceiver",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "resolver",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "nextCommitmentId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const TIME_LEND_CONTRACT = {
  abi: TIME_LEND_CONTRACT_ABI,
  address: TIME_LEND_CONTRACT_ADDRESS,
  chain: TIME_LEND_CHAIN,
} as const;
