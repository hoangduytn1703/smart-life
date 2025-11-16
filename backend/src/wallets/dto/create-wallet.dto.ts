import { IsString, IsBoolean, IsOptional, IsInt, Min } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  name: string;

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
}

