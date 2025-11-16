import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createCategoryDto: CreateCategoryDto) {
    // Nếu có parentId, kiểm tra parent có tồn tại và thuộc về user
    if (createCategoryDto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: {
          id: createCategoryDto.parentId,
          userId,
        },
      });

      if (!parent) {
        throw new NotFoundException('Danh mục cha không tồn tại');
      }

      // Không cho phép tạo category con của category con (chỉ 2 cấp)
      if (parent.parentId) {
        throw new ConflictException('Không thể tạo danh mục con của danh mục con');
      }
    }

    // Kiểm tra category đã tồn tại với cùng parentId
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        userId,
        name: createCategoryDto.name,
        parentId: createCategoryDto.parentId || null,
      },
    });

    if (existingCategory) {
      throw new ConflictException('Danh mục đã tồn tại');
    }

    const category = await this.prisma.category.create({
      data: {
        userId,
        name: createCategoryDto.name,
        parentId: createCategoryDto.parentId || null,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return category;
  }

  async findAll(userId: string) {
    const categories = await this.prisma.category.findMany({
      where: { userId },
      include: {
        parent: true,
        children: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: [
        { parentId: 'asc' },
        { name: 'asc' },
      ],
    });

    return categories;
  }

  async findOne(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        parent: true,
        children: {
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    return category;
  }

  async update(userId: string, id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(userId, id);

    // Kiểm tra không được set parent là chính nó
    if (updateCategoryDto.parentId === id) {
      throw new ConflictException('Không thể đặt danh mục làm cha của chính nó');
    }

    // Nếu có parentId, kiểm tra parent có tồn tại và thuộc về user
    if (updateCategoryDto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: {
          id: updateCategoryDto.parentId,
          userId,
        },
      });

      if (!parent) {
        throw new NotFoundException('Danh mục cha không tồn tại');
      }

      // Không cho phép tạo category con của category con
      if (parent.parentId) {
        throw new ConflictException('Không thể đặt danh mục con của danh mục con làm cha');
      }

      // Kiểm tra không được set parent là một trong các children
      const isDescendant = await this.prisma.category.findFirst({
        where: {
          id: updateCategoryDto.parentId,
          parentId: id,
        },
      });

      if (isDescendant) {
        throw new ConflictException('Không thể đặt danh mục con làm cha');
      }
    }

    // Nếu đổi tên hoặc parentId, kiểm tra trùng
    const nameToCheck = updateCategoryDto.name ?? category.name;
    const parentIdToCheck = updateCategoryDto.parentId !== undefined 
      ? (updateCategoryDto.parentId || null)
      : category.parentId;

    if (nameToCheck !== category.name || parentIdToCheck !== category.parentId) {
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          userId,
          name: nameToCheck,
          parentId: parentIdToCheck,
          id: { not: id },
        },
      });

      if (existingCategory) {
        throw new ConflictException('Danh mục đã tồn tại');
      }
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        parent: true,
        children: {
          orderBy: { name: 'asc' },
        },
      },
    });

    return updatedCategory;
  }

  async remove(userId: string, id: string) {
    const category = await this.findOne(userId, id);

    // Kiểm tra xem category có đang được sử dụng không
    const expenseCount = await this.prisma.expense.count({
      where: { categoryId: id },
    });

    if (expenseCount > 0) {
      throw new ConflictException(
        'Không thể xóa danh mục đang được sử dụng. Vui lòng xóa hoặc chuyển các chi tiêu liên quan trước.',
      );
    }

    // Kiểm tra xem category có children không
    const childrenCount = await this.prisma.category.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      throw new ConflictException(
        'Không thể xóa danh mục có danh mục con. Vui lòng xóa hoặc di chuyển các danh mục con trước.',
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: 'Xóa danh mục thành công' };
  }

  async importDefaultCategories(userId: string) {
    // Kiểm tra xem user đã có categories chưa
    const existingCategories = await this.prisma.category.count({
      where: { userId },
    });

    if (existingCategories > 0) {
      throw new ConflictException('Bạn đã có danh mục. Vui lòng xóa tất cả danh mục hiện tại trước khi import.');
    }

    // Định nghĩa cấu trúc categories với hierarchy
    const categoriesData = [
      {
        name: '🏡 Gia đình',
        children: [
          'Sửa & trang trí nhà',
          'Điện nước wifi nhà',
          'Con cái',
          'Sửa chữa nhà cửa',
          'Báo Hiếu',
          'Em Gái',
        ],
      },
      {
        name: '❤️ Sức khỏe',
        children: [
          'Làm đẹp',
          'Khám sức khoẻ',
          'Chăm sóc cá nhân (hớt tóc..)',
          'Thuốc',
          'Thể thao',
        ],
      },
      {
        name: '🎓 Giáo dục',
        children: ['Sách', 'Học Phí'],
      },
      {
        name: '🕹️ Giải trí',
        children: [
          'Dịch vụ trực tuyến',
          'Ăn chơi nhậu nhẹt 🍻',
          'Cà phê',
          'Trò chơi',
          'Phim ảnh',
          'Mua vé số',
          'Bet',
        ],
      },
      {
        name: '🛡️ Bảo hiểm',
        children: [],
      },
      {
        name: '📈 Đầu tư',
        children: [],
      },
      {
        name: '🚗 Di chuyển',
        children: ['Bảo dưỡng xe', 'Gửi xe', 'Xăng dầu', 'Taxi'],
      },
      {
        name: '🛍️ Mua sắm',
        children: [
          'Đồ dùng cá nhân',
          'Đồ gia dụng',
          'Phụ kiện',
          'Quần áo',
          'Thiết bị điện tử',
        ],
      },
      {
        name: '🍜 Ăn uống',
        children: [
          'Nhà hàng',
          'Mua mì, trứng, nước...',
          'Ăn Chiều, Tối',
          'Ăn Sáng',
          'Ăn Trưa',
          'Cafe',
        ],
      },
      {
        name: '🧾 Hoá đơn & Tiện ích',
        children: [
          'Hoá đơn điện thoại',
          'Hoá đơn nước',
          'Hoá đơn điện',
          'Hoá đơn gas',
          'Hoá đơn TV',
          'Hoá đơn internet',
          'Thuê nhà',
        ],
      },
      {
        name: '💸 Chi phí',
        children: [
          'Quà tặng & Quyên góp',
          'Tang lễ',
          'Cưới hỏi',
          'Chi Phí Tết',
          'Đóng Quỹ, Party...',
        ],
      },
      {
        name: '👩‍❤️‍👨 Bạn bè & Người yêu',
        children: [
          'Mua Sắm',
          'Quà Cáp',
          'Ăn Uống',
          'Du lịch với nhau',
        ],
      },
      {
        name: '✈️ Du lịch',
        children: [
          'Khách sạn',
          'Ăn chơi',
          'Di chuyển. Thuê xe',
          'Vé máy bay',
          'Mua đồ lặt vặt',
        ],
      },
      {
        name: '🔄 Chuyển tiền qua lại',
        children: [],
      },
      {
        name: '🎉 Sự kiện',
        children: [
          'Lì Xì',
          'Tiền Biểu',
          'Trước Tết',
          'Ăn Chơi Tết',
          'Quần áo tết 2 đứa',
          'Dưới quê (làm này làm kia)',
        ],
      },
      {
        name: '🏦 Nợ nần',
        children: ['Nợ HSBC', 'Nợ VIB', 'Nợ khác (momo...)'],
      },
    ];

    // Tạo parent categories trước
    const parentCategories = new Map<string, string>();

    for (const categoryData of categoriesData) {
      const parent = await this.prisma.category.create({
        data: {
          userId,
          name: categoryData.name,
          type: 'expense',
        },
      });

      parentCategories.set(categoryData.name, parent.id);

      // Tạo children categories
      if (categoryData.children.length > 0) {
        await this.prisma.category.createMany({
          data: categoryData.children.map((childName) => ({
            userId,
            name: childName,
            parentId: parent.id,
            type: 'expense',
          })),
        });
      }
    }

    // Tạo income categories
    const incomeCategoriesData = [
      {
        name: '💰 Lương',
        children: ['Lương cứng', 'Freelance', 'OT'],
      },
      {
        name: '🛒 Bán hàng',
        children: [],
      },
      {
        name: '💵 Thu nhập khác',
        children: [],
      },
    ];

    for (const categoryData of incomeCategoriesData) {
      const parent = await this.prisma.category.create({
        data: {
          userId,
          name: categoryData.name,
          type: 'income',
        },
      });

      // Tạo children categories
      if (categoryData.children.length > 0) {
        await this.prisma.category.createMany({
          data: categoryData.children.map((childName) => ({
            userId,
            name: childName,
            parentId: parent.id,
            type: 'income',
          })),
        });
      }
    }

    return { message: 'Import danh mục mặc định thành công', count: categoriesData.length + incomeCategoriesData.length };
  }
}

