import { IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateIncomeDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Số tiền phải là số' })
  @Min(0.01, { message: 'Số tiền phải lớn hơn 0' })
  amount?: number;

  @IsOptional()
  @IsString({ message: 'Category ID phải là chuỗi' })
  categoryId?: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày không hợp lệ' })
  date?: string;

  @IsOptional()
  @IsString({ message: 'Wallet ID phải là chuỗi' })
  walletId?: string;
}

