import { PartialType } from '@nestjs/mapped-types';
import { CreateWalletDto } from './create-wallet.dto';
import { IsString, IsBoolean, IsOptional, IsInt, Min, IsNumber } from 'class-validator';

export class UpdateWalletDto extends PartialType(CreateWalletDto) {
  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  includedInTotal?: boolean;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  balance?: number;
}

