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
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { TransferMoneyDto } from './dto/transfer-money.dto';
import { ReorderWalletsDto } from './dto/reorder-wallets.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  async create(@CurrentUser() user: any, @Body() createWalletDto: CreateWalletDto) {
    const wallet = await this.walletsService.create(user.id, createWalletDto);
    return {
      message: 'Tạo ví thành công',
      data: wallet,
    };
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    const wallets = await this.walletsService.findAll(user.id);
    return {
      message: 'Lấy danh sách ví thành công',
      data: wallets,
    };
  }

  @Get('total-balance')
  async getTotalBalance(@CurrentUser() user: any) {
    const result = await this.walletsService.getTotalBalance(user.id);
    return {
      message: 'Lấy tổng số dư thành công',
      data: result,
    };
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const wallet = await this.walletsService.findOne(user.id, id);
    return {
      message: 'Lấy thông tin ví thành công',
      data: wallet,
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateWalletDto: UpdateWalletDto,
  ) {
    const wallet = await this.walletsService.update(user.id, id, updateWalletDto);
    return {
      message: 'Cập nhật ví thành công',
      data: wallet,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    const result = await this.walletsService.remove(user.id, id);
    return result;
  }

  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  async transferMoney(@CurrentUser() user: any, @Body() transferDto: TransferMoneyDto) {
    const result = await this.walletsService.transferMoney(user.id, transferDto);
    return result;
  }

  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  async reorder(@CurrentUser() user: any, @Body() reorderDto: ReorderWalletsDto) {
    const result = await this.walletsService.reorder(user.id, reorderDto);
    return result;
  }
}

