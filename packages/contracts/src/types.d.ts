declare module "*.json" {
  const value: {
    abi: import("viem").Abi;
    bytecode?: { object: string };
    deployedBytecode?: { object: string };
  };
  export default value;
}

declare module "@repo/contracts/TimeLendMVP" {
  import type { Abi } from "viem";
  const artifact: {
    abi: Abi;
    bytecode?: { object: string };
    deployedBytecode?: { object: string };
  };
  export default artifact;
}
