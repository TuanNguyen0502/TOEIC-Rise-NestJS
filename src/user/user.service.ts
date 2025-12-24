import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from 'src/entities/account.entity';
import { User } from 'src/entities/user.entity';
import { Role } from 'src/entities/role.entity';
import { EGender } from 'src/enums/EGender.enum';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';
import { ProfileUpdateDto } from './dto/profile-update.dto';
import { PROFILE_AVATAR_MAX_SIZE } from 'src/common/constants/constants';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UserResponse } from './dto/user-response.dto';
import { PageResponse } from './dto/page-response.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async findOneByEmail(email: string): Promise<Account | null> {
    return this.accountRepository.findOne({
      where: { email },
      relations: ['user', 'user.role'],
    });
  }

  async saveAccount(account: Account): Promise<Account> {
    return this.accountRepository.save(account);
  }

  async createAccountAndUser(
    accountData: Partial<Account>,
    fullName: string,
    role: Role,
  ): Promise<Account> {
    const newAccount = this.accountRepository.create(accountData);
    const newUser = this.userRepository.create({
      fullName,
      role,
      account: newAccount,
      gender: EGender.OTHER,
    });

    // Do quan hệ cascade, chỉ cần save user
    // Hoặc save account trước, gán user.account, rồi save user
    // Tùy theo cài đặt @OneToOne
    await this.accountRepository.save(newAccount);
    newUser.account = newAccount;
    await this.userRepository.save(newUser);
    return newAccount;
  }

  async findUserByAccountId(accountId: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { account: { id: accountId } },
      relations: ['account', 'role'],
    });
  }

  async saveUser(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async findAccountByRefreshToken(
    refreshToken: string,
  ): Promise<Account | null> {
    return this.accountRepository.findOne({
      where: { refreshToken },
      relations: ['user', 'user.role'],
    });
  }

  async getUserProfileByEmail(email: string): Promise<ProfileResponseDto> {
    const account = await this.findOneByEmail(email);
    if (!account) {
      throw new AppException(ErrorCode.UNAUTHORIZED);
    }

    const user = await this.findUserByAccountId(account.id);
    if (!user) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'User');
    }

    return {
      email: account.email,
      fullName: user.fullName,
      gender: user.gender,
      avatar: user.avatar,
    };
  }

  async updateUserProfile(
    email: string,
    dto: ProfileUpdateDto,
    avatar?: Express.Multer.File,
  ): Promise<void> {
    const account = await this.findOneByEmail(email);
    if (!account) throw new AppException(ErrorCode.UNAUTHORIZED);

    const user = await this.findUserByAccountId(account.id);
    if (!user) throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'User');

    if (avatar) {
      if (avatar.size > PROFILE_AVATAR_MAX_SIZE) {
        throw new AppException(ErrorCode.IMAGE_SIZE_EXCEEDED);
      }
      this.cloudinary.validateImageName(avatar.originalname);
      const url = await this.cloudinary.uploadBuffer(avatar.buffer);
      user.avatar = url;
    }

    user.fullName = dto.fullName;
    user.gender = dto.gender;
    await this.userRepository.save(user);
  }

  async getAllUsers(
    query: GetUsersQueryDto,
  ): Promise<PageResponse<UserResponse>> {
    const {
      page = 0,
      size = 10,
      email,
      isActive,
      role,
      sortBy = 'updatedAt',
      direction = 'DESC',
    } = query;

    const skip = page * size;

    // 1. QueryBuilder
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.account', 'account')
      .leftJoinAndSelect('user.role', 'role');

    // 2. Filter Email
    if (email) {
      qb.andWhere('LOWER(account.email) LIKE LOWER(:email)', {
        email: `%${email}%`,
      });
    }

    // 3. Filter IsActive
    if (isActive !== undefined) {
      qb.andWhere('account.isActive = :isActive', { isActive });
    }

    // 4. Filter Role
    if (role) {
      // --- SỬA 2: So sánh cột name của bảng role ---
      qb.andWhere('role.name = :role', { role });
    }

    // 5. Sorting
    const sortFieldMap: Record<string, string> = {
      userId: 'user.id',
      id: 'user.id',
      fullName: 'user.fullName',
      updatedAt: 'user.updatedAt',
      email: 'account.email',
      isActive: 'account.isActive',
      role: 'role.name',
    };

    const dbSortField = sortFieldMap[sortBy] || 'user.updatedAt';
    qb.orderBy(dbSortField, direction.toUpperCase() as 'ASC' | 'DESC');

    // 6. Pagination
    qb.skip(skip).take(size);

    // 7. Execute
    const [users, total] = await qb.getManyAndCount();

    // 8. Mapping
    const result = users.map((user) => this.mapToUserResponse(user));

    return new PageResponse(result, page, size, total);
  }

  private mapToUserResponse(user: User): UserResponse {
    return {
      userId: user.id,
      email: user.account?.email || '',
      isActive: user.account?.isActive ?? false,
      fullName: user.fullName,
      avatar: user.avatar || null,
      role: (user.role?.name as any) || null,
      // --- SỬA 3: Format ngày tháng giống Java (Tùy chọn) ---
      // Nếu Frontend tự format được ISO string thì giữ nguyên toISOString()
      // Nếu muốn giống hệt Spring Boot:
      updatedAt: user.updatedAt ? this.formatDate(user.updatedAt) : '',
    };
  }

  // Hàm helper format ngày (dd-MM-yyyy HH:mm:ss)
  private formatDate(date: Date): string {
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
}
