import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@CurrentUser() user: any, @Body() createCategoryDto: CreateCategoryDto) {
    const category = await this.categoriesService.create(user.id, createCategoryDto);
    return {
      message: 'Tạo danh mục thành công',
      data: category,
    };
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    const categories = await this.categoriesService.findAll(user.id);
    return {
      message: 'Lấy danh sách danh mục thành công',
      data: categories,
    };
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const category = await this.categoriesService.findOne(user.id, id);
    return {
      message: 'Lấy thông tin danh mục thành công',
      data: category,
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.categoriesService.update(user.id, id, updateCategoryDto);
    return {
      message: 'Cập nhật danh mục thành công',
      data: category,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    const result = await this.categoriesService.remove(user.id, id);
    return result;
  }

  @Post('import-default')
  @HttpCode(HttpStatus.OK)
  async importDefault(@CurrentUser() user: any) {
    const result = await this.categoriesService.importDefaultCategories(user.id);
    return result;
  }
}

