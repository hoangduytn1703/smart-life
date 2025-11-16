import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IncomesService } from './incomes.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { IncomeQueryDto } from './dto/income-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('incomes')
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Post()
  async create(@CurrentUser() user: any, @Body() createIncomeDto: CreateIncomeDto) {
    const income = await this.incomesService.create(user.id, createIncomeDto);
    return {
      message: 'Tạo thu nhập thành công',
      data: income,
    };
  }

  @Get()
  async findAll(@CurrentUser() user: any, @Query() query: IncomeQueryDto) {
    const incomes = await this.incomesService.findAll(user.id, query);
    return {
      message: 'Lấy danh sách thu nhập thành công',
      data: incomes,
    };
  }

  @Get('analytics')
  async getAnalytics(@CurrentUser() user: any, @Query() query: IncomeQueryDto) {
    const analytics = await this.incomesService.getAnalytics(user.id, query);
    return {
      message: 'Lấy thống kê thành công',
      data: analytics,
    };
  }

  @Get('daily/:date')
  async getDailyTotal(@CurrentUser() user: any, @Param('date') date: string) {
    const result = await this.incomesService.getDailyTotal(user.id, date);
    return {
      message: 'Lấy tổng thu nhập theo ngày thành công',
      data: result,
    };
  }

  @Get('weekly/:startDate')
  async getWeeklyTotal(@CurrentUser() user: any, @Param('startDate') startDate: string) {
    const result = await this.incomesService.getWeeklyTotal(user.id, startDate);
    return {
      message: 'Lấy tổng thu nhập theo tuần thành công',
      data: result,
    };
  }

  @Get('monthly/:year/:month')
  async getMonthlyTotal(
    @CurrentUser() user: any,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    const result = await this.incomesService.getMonthlyTotal(
      user.id,
      parseInt(year),
      parseInt(month),
    );
    return {
      message: 'Lấy tổng thu nhập theo tháng thành công',
      data: result,
    };
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const income = await this.incomesService.findOne(user.id, id);
    return {
      message: 'Lấy thông tin thu nhập thành công',
      data: income,
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateIncomeDto: UpdateIncomeDto,
  ) {
    const income = await this.incomesService.update(user.id, id, updateIncomeDto);
    return {
      message: 'Cập nhật thu nhập thành công',
      data: income,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    const result = await this.incomesService.remove(user.id, id);
    return result;
  }
}

