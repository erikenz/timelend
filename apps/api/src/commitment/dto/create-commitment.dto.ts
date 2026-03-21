import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateCommitmentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @IsBoolean()
  @IsOptional()
  paid?: boolean;

  @IsInt()
  @IsNotEmpty()
  userId!: number;
}
