import { IsString, MinLength, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @IsString({ message: 'Tên danh mục phải là chuỗi' })
  @MinLength(1, { message: 'Tên danh mục không được để trống' })
  @MaxLength(100, { message: 'Tên danh mục không được vượt quá 100 ký tự' })
  name: string;

  @IsOptional()
  @IsUUID('4', { message: 'Parent ID phải là UUID hợp lệ' })
  parentId?: string;
}

