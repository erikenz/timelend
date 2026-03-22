import {
  IsEthereumAddress,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class SubmitProofDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(3000)
  proof?: string;

  @IsEthereumAddress()
  walletAddress!: string;
}
