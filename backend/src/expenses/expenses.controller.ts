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
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  async create(@CurrentUser() user: any, @Body() createExpenseDto: CreateExpenseDto) {
    const expense = await this.expensesService.create(user.id, createExpenseDto);
    return {
      message: 'Tạo chi tiêu thành công',
      data: expense,
    };
  }

  @Get()
  async findAll(@CurrentUser() user: any, @Query() query: ExpenseQueryDto) {
    const expenses = await this.expensesService.findAll(user.id, query);
    return {
      message: 'Lấy danh sách chi tiêu thành công',
      data: expenses,
    };
  }

  @Get('analytics')
  async getAnalytics(@CurrentUser() user: any, @Query() query: ExpenseQueryDto) {
    const analytics = await this.expensesService.getAnalytics(user.id, query);
    return {
      message: 'Lấy thống kê thành công',
      data: analytics,
    };
  }

  @Get('daily/:date')
  async getDailyTotal(@CurrentUser() user: any, @Param('date') date: string) {
    const result = await this.expensesService.getDailyTotal(user.id, date);
    return {
      message: 'Lấy tổng chi tiêu theo ngày thành công',
      data: result,
    };
  }

  @Get('weekly/:startDate')
  async getWeeklyTotal(@CurrentUser() user: any, @Param('startDate') startDate: string) {
    const result = await this.expensesService.getWeeklyTotal(user.id, startDate);
    return {
      message: 'Lấy tổng chi tiêu theo tuần thành công',
      data: result,
    };
  }

  @Get('monthly/:year/:month')
  async getMonthlyTotal(
    @CurrentUser() user: any,
    @Param('year') year: string,
    @Param('month') month: string,
  ) {
    const result = await this.expensesService.getMonthlyTotal(
      user.id,
      parseInt(year),
      parseInt(month),
    );
    return {
      message: 'Lấy tổng chi tiêu theo tháng thành công',
      data: result,
    };
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const expense = await this.expensesService.findOne(user.id, id);
    return {
      message: 'Lấy thông tin chi tiêu thành công',
      data: expense,
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    const expense = await this.expensesService.update(user.id, id, updateExpenseDto);
    return {
      message: 'Cập nhật chi tiêu thành công',
      data: expense,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    const result = await this.expensesService.remove(user.id, id);
    return result;
  }
}

