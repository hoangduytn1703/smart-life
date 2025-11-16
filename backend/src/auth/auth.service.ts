import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Kiểm tra email đã tồn tại
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Tạo user mới
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Tạo các category mặc định với hierarchy
    await this.createDefaultCategories(user.id);

    // Tạo tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    // Tìm user
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Kiểm tra password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Tạo tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      ...tokens,
    };
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    return this.generateTokens(user.id, user.email);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Không trả về lỗi để tránh leak thông tin
      return {
        message: 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu',
      };
    }

    // TODO: Gửi email reset password
    // Hiện tại chỉ trả về message
    return {
      message: 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu',
    };
  }

  private async createDefaultCategories(userId: string) {
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
          })),
        });
      }
    }
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}

