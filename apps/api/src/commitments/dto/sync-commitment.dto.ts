import {
  IsEthereumAddress,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class SyncCommitmentDto {
  @IsInt()
  @Min(0)
  commitmentId!: number;

  @IsOptional()
  @IsString()
  txHash?: string;

  @IsOptional()
  @IsEthereumAddress()
  walletAddress?: string;
}
