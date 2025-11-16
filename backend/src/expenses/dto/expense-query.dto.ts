import { IsOptional, IsDateString, IsString } from 'class-validator';

export class ExpenseQueryDto {
  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  endDate?: string;

  @IsOptional()
  @IsString({ message: 'Category ID phải là chuỗi' })
  categoryId?: string;

  @IsOptional()
  @IsString({ message: 'Wallet ID phải là chuỗi' })
  walletId?: string;
}

