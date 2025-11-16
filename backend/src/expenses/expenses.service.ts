import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseQueryDto } from './dto/expense-query.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createExpenseDto: CreateExpenseDto) {
    // Kiểm tra category thuộc về user
    const category = await this.prisma.category.findFirst({
      where: {
        id: createExpenseDto.categoryId,
        userId,
      },
    });

    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    // Kiểm tra wallet nếu có
    if (createExpenseDto.walletId) {
      const wallet = await this.prisma.wallet.findFirst({
        where: {
          id: createExpenseDto.walletId,
          userId,
        },
      });

      if (!wallet) {
        throw new NotFoundException('Ví không tồn tại');
      }
    }

    const expense = await this.prisma.expense.create({
      data: {
        userId,
        categoryId: createExpenseDto.categoryId,
        walletId: createExpenseDto.walletId || null,
        amount: createExpenseDto.amount,
        description: createExpenseDto.description,
        date: new Date(createExpenseDto.date),
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

    return expense;
  }

  async findAll(userId: string, query: ExpenseQueryDto) {
    const where: Prisma.ExpenseWhereInput = {
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

    const expenses = await this.prisma.expense.findMany({
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

    return expenses;
  }

  async findOne(userId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({
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

    if (!expense) {
      throw new NotFoundException('Chi tiêu không tồn tại');
    }

    return expense;
  }

  async update(userId: string, id: string, updateExpenseDto: UpdateExpenseDto) {
    const expense = await this.findOne(userId, id);

    // Nếu đổi category, kiểm tra category thuộc về user
    if (updateExpenseDto.categoryId && updateExpenseDto.categoryId !== expense.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: updateExpenseDto.categoryId,
          userId,
        },
      });

      if (!category) {
        throw new NotFoundException('Danh mục không tồn tại');
      }
    }

    // Nếu đổi wallet, kiểm tra wallet thuộc về user
    if (updateExpenseDto.walletId !== undefined) {
      if (updateExpenseDto.walletId) {
        const wallet = await this.prisma.wallet.findFirst({
          where: {
            id: updateExpenseDto.walletId,
            userId,
          },
        });

        if (!wallet) {
          throw new NotFoundException('Ví không tồn tại');
        }
      }
    }

    const updatedExpense = await this.prisma.expense.update({
      where: { id },
      data: {
        ...(updateExpenseDto.amount && { amount: updateExpenseDto.amount }),
        ...(updateExpenseDto.categoryId && { categoryId: updateExpenseDto.categoryId }),
        ...(updateExpenseDto.description !== undefined && {
          description: updateExpenseDto.description,
        }),
        ...(updateExpenseDto.date && { date: new Date(updateExpenseDto.date) }),
        ...(updateExpenseDto.walletId !== undefined && {
          walletId: updateExpenseDto.walletId || null,
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

    return updatedExpense;
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.expense.delete({
      where: { id },
    });

    return { message: 'Xóa chi tiêu thành công' };
  }

  async getAnalytics(userId: string, query: ExpenseQueryDto) {
    const where: Prisma.ExpenseWhereInput = {
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
    const totalResult = await this.prisma.expense.aggregate({
      where,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Thống kê theo category
    const categoryStats = await this.prisma.expense.groupBy({
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
    const walletStats = await this.prisma.expense.groupBy({
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
      FROM expenses
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

    const result = await this.prisma.expense.aggregate({
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

    const result = await this.prisma.expense.aggregate({
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

    const result = await this.prisma.expense.aggregate({
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

