import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { TIME_LEND_CONTRACT_ABI } from "@repo/contracts/timelend-contract";
import {
  Contract,
  isError,
  JsonRpcProvider,
  Wallet,
  ZeroAddress,
} from "ethers";

import {
  type AppMode,
  getAppMode,
  getContractAddress,
  getResolverPrivateKey,
  getRpcUrl,
} from "../config/env";

export interface OnchainCommitment {
  createdAt: bigint;
  deadline: bigint;
  penaltyReceiver: string;
  stake: bigint;
  status: number;
  taskDescription: string;
  user: string;
}

export interface ContractRuntimeStatus {
  contractAddress: string;
  defaultPenaltyReceiver: string;
  mode: AppMode;
  resolverAddress: string;
  signerAddress: string | null;
  signerMatchesResolver: boolean | null;
}

type ReadContract = Contract & {
  defaultPenaltyReceiver: () => Promise<string>;
  getCommitment: (commitmentId: bigint) => Promise<OnchainCommitment>;
  resolver: () => Promise<string>;
};

type WriteContract = Contract & {
  resolveCommitment: (
    commitmentId: bigint,
    passed: boolean
  ) => Promise<{
    hash: string;
    wait: () => Promise<unknown>;
  }>;
};

type RawTupleValue = Record<string, unknown> & {
  [index: number]: unknown;
};

const readTupleField = <T>(
  value: RawTupleValue,
  key: string,
  index: number
) => {
  const namedValue = value[key];

  if (namedValue !== undefined) {
    return namedValue as T;
  }

  return value[index] as T;
};

const readErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (isError(error, "CALL_EXCEPTION")) {
    return error.shortMessage || fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
};

@Injectable()
export class ContractService {
  private readonly contractAddress = getContractAddress();

  private readonly mode = getAppMode();

  private provider: JsonRpcProvider | null = null;

  private readContract: ReadContract | null = null;

  private wallet: Wallet | null = null;

  private writeContract: WriteContract | null = null;

  getMode() {
    return this.mode;
  }

  isExistingCommitment(commitment: OnchainCommitment) {
    return commitment.user !== ZeroAddress;
  }

  async getCommitment(commitmentId: bigint | number) {
    try {
      const contract = this.getReadContract();
      const commitment = (await contract.getCommitment(
        BigInt(commitmentId)
      )) as unknown as RawTupleValue;

      return {
        createdAt: BigInt(readTupleField<bigint>(commitment, "createdAt", 3)),
        deadline: BigInt(readTupleField<bigint>(commitment, "deadline", 4)),
        penaltyReceiver: readTupleField<string>(
          commitment,
          "penaltyReceiver",
          1
        ),
        stake: BigInt(readTupleField<bigint>(commitment, "stake", 2)),
        status: Number(
          readTupleField<number | bigint>(commitment, "status", 5)
        ),
        taskDescription: readTupleField<string>(
          commitment,
          "taskDescription",
          6
        ),
        user: readTupleField<string>(commitment, "user", 0),
      } satisfies OnchainCommitment;
    } catch (error) {
      throw new BadGatewayException(
        `Failed to read commitment from chain: ${readErrorMessage(
          error,
          "unknown blockchain error"
        )}`
      );
    }
  }

  async getRuntimeStatus() {
    try {
      const contract = this.getReadContract();
      const [defaultPenaltyReceiver, resolverAddress] = await Promise.all([
        contract.defaultPenaltyReceiver(),
        contract.resolver(),
      ]);
      const signerAddress =
        this.mode === "real" ? await this.getWallet().getAddress() : null;

      return {
        contractAddress: this.contractAddress,
        defaultPenaltyReceiver,
        mode: this.mode,
        resolverAddress,
        signerAddress,
        signerMatchesResolver: signerAddress
          ? signerAddress.toLowerCase() === resolverAddress.toLowerCase()
          : null,
      } satisfies ContractRuntimeStatus;
    } catch (error) {
      throw new BadGatewayException(
        `Failed to inspect contract configuration: ${readErrorMessage(
          error,
          "unknown blockchain error"
        )}`
      );
    }
  }

  async resolveCommitment(commitmentId: bigint | number, passed: boolean) {
    if (this.mode !== "real") {
      throw new ServiceUnavailableException(
        "Contract resolution is disabled while MODE=readonly"
      );
    }

    try {
      const contract = this.getWriteContract();
      const transaction = await contract.resolveCommitment(
        BigInt(commitmentId),
        passed
      );

      await transaction.wait();

      return {
        hash: transaction.hash,
      };
    } catch (error) {
      throw new BadGatewayException(
        `Failed to resolve commitment on-chain: ${readErrorMessage(
          error,
          "unknown blockchain error"
        )}`
      );
    }
  }

  private getProvider() {
    if (this.provider) {
      return this.provider;
    }

    this.provider = new JsonRpcProvider(getRpcUrl());

    return this.provider;
  }

  private getReadContract() {
    if (this.readContract) {
      return this.readContract;
    }

    this.readContract = new Contract(
      this.contractAddress,
      TIME_LEND_CONTRACT_ABI,
      this.getProvider()
    ) as ReadContract;

    return this.readContract;
  }

  private getWallet() {
    if (this.wallet) {
      return this.wallet;
    }

    this.wallet = new Wallet(getResolverPrivateKey(), this.getProvider());

    return this.wallet;
  }

  private getWriteContract() {
    if (this.writeContract) {
      return this.writeContract;
    }

    this.writeContract = new Contract(
      this.contractAddress,
      TIME_LEND_CONTRACT_ABI,
      this.getWallet()
    ) as WriteContract;

    return this.writeContract;
  }
}
