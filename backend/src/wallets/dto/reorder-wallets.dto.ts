import { IsArray, ValidateNested, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class WalletOrder {
  @IsString()
  id: string;

  @IsInt()
  order: number;
}

export class ReorderWalletsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WalletOrder)
  wallets: WalletOrder[];
}

