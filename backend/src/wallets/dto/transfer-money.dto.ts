import { IsString, IsNumber, Min, IsNotEmpty } from 'class-validator';

export class TransferMoneyDto {
  @IsString()
  @IsNotEmpty()
  fromWalletId: string;

  @IsString()
  @IsNotEmpty()
  toWalletId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  description?: string;
}

