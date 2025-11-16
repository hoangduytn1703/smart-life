import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { TransferMoneyDto } from './dto/transfer-money.dto';
import { ReorderWalletsDto } from './dto/reorder-wallets.dto';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createWalletDto: CreateWalletDto) {
    // Kiểm tra tên ví đã tồn tại
    const existingWallet = await this.prisma.wallet.findFirst({
      where: {
        userId,
        name: createWalletDto.name,
      },
    });

    if (existingWallet) {
      throw new ConflictException('Tên ví đã tồn tại');
    }

    // Lấy order cao nhất để đặt ví mới ở cuối
    const maxOrder = await this.prisma.wallet.findFirst({
      where: { userId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const wallet = await this.prisma.wallet.create({
      data: {
        userId,
        name: createWalletDto.name,
        balance: 0,
        includedInTotal: createWalletDto.includedInTotal ?? true,
        icon: createWalletDto.icon || '💼',
        color: createWalletDto.color || '#3b82f6',
        order: createWalletDto.order ?? (maxOrder ? maxOrder.order + 1 : 0),
      },
    });

    return wallet;
  }

  async findAll(userId: string) {
    const wallets = await this.prisma.wallet.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });

    return wallets;
  }

  async findOne(userId: string, id: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!wallet) {
      throw new NotFoundException('Ví không tồn tại');
    }

    return wallet;
  }

  async update(userId: string, id: string, updateWalletDto: UpdateWalletDto) {
    const wallet = await this.findOne(userId, id);

    // Nếu đổi tên, kiểm tra trùng
    if (updateWalletDto.name && updateWalletDto.name !== wallet.name) {
      const existingWallet = await this.prisma.wallet.findFirst({
        where: {
          userId,
          name: updateWalletDto.name,
          id: { not: id },
        },
      });

      if (existingWallet) {
        throw new ConflictException('Tên ví đã tồn tại');
      }
    }

    const updatedWallet = await this.prisma.wallet.update({
      where: { id },
      data: updateWalletDto,
    });

    return updatedWallet;
  }

  async remove(userId: string, id: string) {
    const wallet = await this.findOne(userId, id);

    // Kiểm tra xem ví có giao dịch không
    const expenseCount = await this.prisma.expense.count({
      where: { walletId: id },
    });

    if (expenseCount > 0) {
      throw new ConflictException(
        'Không thể xóa ví có giao dịch. Vui lòng xóa hoặc chuyển các giao dịch trước.',
      );
    }

    await this.prisma.wallet.delete({
      where: { id },
    });

    return { message: 'Xóa ví thành công' };
  }

  async transferMoney(userId: string, transferDto: TransferMoneyDto) {
    if (transferDto.fromWalletId === transferDto.toWalletId) {
      throw new BadRequestException('Không thể chuyển tiền vào cùng một ví');
    }

    const fromWallet = await this.findOne(userId, transferDto.fromWalletId);
    const toWallet = await this.findOne(userId, transferDto.toWalletId);

    if (Number(fromWallet.balance) < transferDto.amount) {
      throw new BadRequestException('Số dư không đủ để chuyển');
    }

    // Sử dụng transaction để đảm bảo tính nhất quán
    await this.prisma.$transaction(async (tx) => {
      // Trừ tiền từ ví nguồn
      await tx.wallet.update({
        where: { id: fromWallet.id },
        data: {
          balance: {
            decrement: transferDto.amount,
          },
        },
      });

      // Cộng tiền vào ví đích
      await tx.wallet.update({
        where: { id: toWallet.id },
        data: {
          balance: {
            increment: transferDto.amount,
          },
        },
      });

      // Tạo giao dịch chuyển tiền (nếu cần lưu lịch sử)
      // Có thể tạo expense records hoặc transaction records riêng
    });

    return { message: 'Chuyển tiền thành công' };
  }

  async reorder(userId: string, reorderDto: ReorderWalletsDto) {
    // Kiểm tra tất cả ví đều thuộc về user
    const walletIds = reorderDto.wallets.map((w) => w.id);
    const wallets = await this.prisma.wallet.findMany({
      where: {
        id: { in: walletIds },
        userId,
      },
    });

    if (wallets.length !== walletIds.length) {
      throw new NotFoundException('Một số ví không tồn tại hoặc không thuộc về bạn');
    }

    // Cập nhật order cho từng ví
    await Promise.all(
      reorderDto.wallets.map((walletOrder) =>
        this.prisma.wallet.update({
          where: { id: walletOrder.id },
          data: { order: walletOrder.order },
        }),
      ),
    );

    return { message: 'Sắp xếp lại ví thành công' };
  }

  async getTotalBalance(userId: string) {
    const wallets = await this.prisma.wallet.findMany({
      where: {
        userId,
        includedInTotal: true,
      },
      select: {
        balance: true,
      },
    });

    const total = wallets.reduce(
      (sum, wallet) => sum + Number(wallet.balance),
      0,
    );

    return { totalBalance: total };
  }
}

