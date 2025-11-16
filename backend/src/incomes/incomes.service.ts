import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { IncomeQueryDto } from './dto/income-query.dto';

@Injectable()
export class IncomesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createIncomeDto: CreateIncomeDto) {
    // Kiểm tra category thuộc về user và là income category
    const category = await this.prisma.category.findFirst({
      where: {
        id: createIncomeDto.categoryId,
        userId,
        type: 'income',
      },
    });

    if (!category) {
      throw new NotFoundException('Danh mục thu nhập không tồn tại');
    }

    // Kiểm tra wallet nếu có (loại bỏ empty string)
    const walletId = createIncomeDto.walletId?.trim() || null;
    let wallet = null;
    if (walletId) {
      wallet = await this.prisma.wallet.findFirst({
        where: {
          id: walletId,
          userId,
        },
      });

      if (!wallet) {
        throw new NotFoundException('Ví không tồn tại');
      }
    }

    // Sử dụng transaction để đảm bảo tính nhất quán
    const income = await this.prisma.$transaction(async (tx) => {
      // Tạo income
      const newIncome = await tx.income.create({
        data: {
          userId,
          categoryId: createIncomeDto.categoryId,
          walletId: walletId,
          amount: createIncomeDto.amount,
          description: createIncomeDto.description,
          date: new Date(createIncomeDto.date),
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          wallet: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Cộng số dư vào wallet nếu có
      if (walletId && wallet) {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              increment: createIncomeDto.amount,
            },
          },
        });
      }

      return newIncome;
    });

    return income;
  }

  async findAll(userId: string, query: IncomeQueryDto) {
    const where: Prisma.IncomeWhereInput = {
      userId,
    };

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.walletId) {
      where.walletId = query.walletId;
    }

    const incomes = await this.prisma.income.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        wallet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return incomes;
  }

  async findOne(userId: string, id: string) {
    const income = await this.prisma.income.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        wallet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!income) {
      throw new NotFoundException('Thu nhập không tồn tại');
    }

    return income;
  }

  async update(userId: string, id: string, updateIncomeDto: UpdateIncomeDto) {
    const income = await this.findOne(userId, id);

    // Nếu đổi category, kiểm tra category thuộc về user và là income category
    if (updateIncomeDto.categoryId && updateIncomeDto.categoryId !== income.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: updateIncomeDto.categoryId,
          userId,
          type: 'income',
        },
      });

      if (!category) {
        throw new NotFoundException('Danh mục thu nhập không tồn tại');
      }
    }

    // Kiểm tra wallet mới nếu có thay đổi (loại bỏ empty string)
    let newWallet = null;
    let newWalletId = null;
    if (updateIncomeDto.walletId !== undefined) {
      const walletIdValue = updateIncomeDto.walletId?.trim() || null;
      if (walletIdValue) {
        newWallet = await this.prisma.wallet.findFirst({
          where: {
            id: walletIdValue,
            userId,
          },
        });

        if (!newWallet) {
          throw new NotFoundException('Ví không tồn tại');
        }
        newWalletId = walletIdValue;
      }
    }

    // Lấy wallet cũ nếu có
    let oldWallet = null;
    if (income.walletId) {
      oldWallet = await this.prisma.wallet.findFirst({
        where: {
          id: income.walletId,
          userId,
        },
      });
    }

    const oldAmount = Number(income.amount);
    const newAmount = updateIncomeDto.amount ? Number(updateIncomeDto.amount) : oldAmount;
    const oldWalletId = income.walletId;
    if (updateIncomeDto.walletId === undefined) {
      newWalletId = oldWalletId;
    }

    // Sử dụng transaction để đảm bảo tính nhất quán
    const updatedIncome = await this.prisma.$transaction(async (tx) => {
      // Xử lý cập nhật balance
      if (oldWalletId === newWalletId && oldWalletId) {
        // Cùng wallet, chỉ cần điều chỉnh chênh lệch amount
        if (oldAmount !== newAmount && oldWallet) {
          const balanceChange = newAmount - oldAmount;
          await tx.wallet.update({
            where: { id: oldWallet.id },
            data: {
              balance: {
                increment: balanceChange, // Nếu newAmount > oldAmount thì cộng thêm, ngược lại thì trừ đi
              },
            },
          });
        }
      } else {
        // Khác wallet hoặc đổi từ có wallet sang không có wallet hoặc ngược lại
        // Trừ lại số dư từ wallet cũ nếu có
        if (oldWalletId && oldWallet) {
          await tx.wallet.update({
            where: { id: oldWallet.id },
            data: {
              balance: {
                decrement: oldAmount,
              },
            },
          });
        }

        // Cộng số dư vào wallet mới nếu có
        if (newWalletId && newWallet) {
          await tx.wallet.update({
            where: { id: newWallet.id },
            data: {
              balance: {
                increment: newAmount,
              },
            },
          });
        }
      }

      // Cập nhật income
      const updated = await tx.income.update({
        where: { id },
        data: {
          ...(updateIncomeDto.amount && { amount: updateIncomeDto.amount }),
          ...(updateIncomeDto.categoryId && { categoryId: updateIncomeDto.categoryId }),
          ...(updateIncomeDto.description !== undefined && {
            description: updateIncomeDto.description,
          }),
          ...(updateIncomeDto.date && { date: new Date(updateIncomeDto.date) }),
          ...(updateIncomeDto.walletId !== undefined && {
            walletId: newWalletId,
          }),
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          wallet: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return updated;
    });

    return updatedIncome;
  }

  async remove(userId: string, id: string) {
    const income = await this.findOne(userId, id);

    // Sử dụng transaction để đảm bảo tính nhất quán
    await this.prisma.$transaction(async (tx) => {
      // Trừ lại số dư từ wallet nếu có
      if (income.walletId) {
        const wallet = await tx.wallet.findFirst({
          where: {
            id: income.walletId,
            userId,
          },
        });

        if (wallet) {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: {
                decrement: Number(income.amount),
              },
            },
          });
        }
      }

      // Xóa income
      await tx.income.delete({
        where: { id },
      });
    });

    return { message: 'Xóa thu nhập thành công' };
  }

  async getAnalytics(userId: string, query: IncomeQueryDto) {
    const where: Prisma.IncomeWhereInput = {
      userId,
    };

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.date.lte = new Date(query.endDate);
      }
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.walletId) {
      where.walletId = query.walletId;
    }

    // Tổng tiền
    const totalResult = await this.prisma.income.aggregate({
      where,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Thống kê theo category
    const categoryStats = await this.prisma.income.groupBy({
      by: ['categoryId'],
      where,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Lấy thông tin category
    const categoryIds = categoryStats.map((stat) => stat.categoryId);
    const categories = await this.prisma.category.findMany({
      where: {
        id: { in: categoryIds },
        userId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const categoryMap = new Map(categories.map((cat) => [cat.id, cat.name]));

    const categoryBreakdown = categoryStats.map((stat) => ({
      categoryId: stat.categoryId,
      categoryName: categoryMap.get(stat.categoryId) || 'Không xác định',
      totalAmount: stat._sum.amount || 0,
      count: stat._count.id,
    }));

    // Thống kê theo wallet
    const walletStats = await this.prisma.income.groupBy({
      by: ['walletId'],
      where,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Lấy thông tin wallet
    const walletIds = walletStats.map((stat) => stat.walletId).filter((id) => id !== null) as string[];
    const wallets = await this.prisma.wallet.findMany({
      where: {
        id: { in: walletIds },
        userId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const walletMap = new Map(wallets.map((wallet) => [wallet.id, wallet.name]));

    const walletBreakdown = walletStats.map((stat) => ({
      walletId: stat.walletId,
      walletName: stat.walletId ? (walletMap.get(stat.walletId) || 'Không xác định') : 'Không có ví',
      totalAmount: stat._sum.amount || 0,
      count: stat._count.id,
    }));

    // Thống kê theo ngày
    let dailyStatsQuery = `
      SELECT date, SUM(amount) as total
      FROM incomes
      WHERE user_id = $1
    `;
    const queryParams: any[] = [userId];
    let paramIndex = 2;

    if (query.startDate) {
      dailyStatsQuery += ` AND date >= $${paramIndex}`;
      queryParams.push(new Date(query.startDate));
      paramIndex++;
    }
    if (query.endDate) {
      dailyStatsQuery += ` AND date <= $${paramIndex}`;
      queryParams.push(new Date(query.endDate));
      paramIndex++;
    }
    if (query.categoryId) {
      dailyStatsQuery += ` AND category_id = $${paramIndex}`;
      queryParams.push(query.categoryId);
      paramIndex++;
    }
    if (query.walletId) {
      dailyStatsQuery += ` AND wallet_id = $${paramIndex}`;
      queryParams.push(query.walletId);
      paramIndex++;
    }

    dailyStatsQuery += ` GROUP BY date ORDER BY date DESC LIMIT 30`;

    const dailyStats = await this.prisma.$queryRawUnsafe<
      Array<{ date: Date; total: number }>
    >(dailyStatsQuery, ...queryParams);

    return {
      total: totalResult._sum.amount || 0,
      count: totalResult._count.id,
      categoryBreakdown,
      walletBreakdown,
      dailyStats: dailyStats.map((stat) => ({
        date: stat.date,
        total: Number(stat.total),
      })),
    };
  }

  async getDailyTotal(userId: string, date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.prisma.income.aggregate({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return {
      date,
      total: result._sum.amount || 0,
    };
  }

  async getWeeklyTotal(userId: string, startDate: string) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const result = await this.prisma.income.aggregate({
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      total: result._sum.amount || 0,
    };
  }

  async getMonthlyTotal(userId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(year, month, 0);
    end.setHours(23, 59, 59, 999);

    const result = await this.prisma.income.aggregate({
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return {
      year,
      month,
      total: result._sum.amount || 0,
    };
  }
}

