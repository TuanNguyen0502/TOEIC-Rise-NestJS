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
import { UserDetailResponse } from './dto/user-detail-response.dto';
import * as bcrypt from 'bcrypt';
import { UserCreateRequestDto } from './dto/user-create-request.dto';
import { EAuthProvider } from 'src/enums/EAuthProvider.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cloudinary: CloudinaryService,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
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

  async getUserDetailById(id: number): Promise<UserDetailResponse> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['account', 'role'], // Load quan hệ Account và Role
    });

    if (!user) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        `User with id ${id} not found`,
      );
    }

    return this.mapToUserDetailResponse(user);
  }

  // Helper mapping (Tương đương UserMapper.toUserDetailResponse trong Java)
  private mapToUserDetailResponse(user: User): UserDetailResponse {
    return {
      userId: user.id,
      email: user.account?.email || '',
      authProvider: user.account?.authProvider,
      isActive: user.account?.isActive ?? false,
      fullName: user.fullName,
      gender: user.gender,
      avatar: user.avatar || null,
      role: user.role?.name || null,
      // Format ngày tháng giống Java (dd-MM-yyyy HH:mm:ss)
      createdAt: user.createdAt ? this.formatDate(user.createdAt) : '',
      updatedAt: user.updatedAt ? this.formatDate(user.updatedAt) : '',
    };
  }

  async createUser(
    dto: UserCreateRequestDto,
    avatarFile?: Express.Multer.File,
  ): Promise<void> {
    // 1. Kiểm tra Email trùng (Logic từ isDuplicateEmail)
    const existingAccount = await this.accountRepository.findOne({
      where: { email: dto.email },
    });
    if (existingAccount) {
      throw new AppException(ErrorCode.DUPLICATE_EMAIL);
    }

    // 2. Validate Password
    if (dto.password !== dto.confirmPassword) {
      throw new AppException(ErrorCode.PASSWORD_MISMATCH);
    }

    // 3. Tìm Role
    const role = await this.roleRepository.findOne({
      where: { name: dto.role },
    });
    if (!role) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Role not found');
    }

    // 4. Xử lý Upload Avatar (nếu có)
    let avatarUrl: string | null = null;
    if (avatarFile) {
      this.cloudinary.validateImageFile(avatarFile);
      avatarUrl = await this.cloudinary.uploadFile(avatarFile);
    }

    // 5. Tạo Account Entity
    const account = new Account();
    account.email = dto.email;
    account.password = await bcrypt.hash(dto.password, 10); // Hash password
    account.isActive = true;
    account.authProvider = EAuthProvider.LOCAL;

    // 6. Tạo User Entity
    const user = new User();
    user.fullName = dto.fullName;
    user.gender = dto.gender;
    user.avatar = avatarUrl || undefined;
    user.role = role;
    user.createdAt = new Date();
    user.updatedAt = new Date();

    // Gán quan hệ: User sở hữu Account (dựa trên cấu hình Entity của bạn)
    // Nếu User.entity.ts có @OneToOne(() => Account, { cascade: true }) thì chỉ cần save User
    user.account = account;

    // 7. Lưu xuống DB
    await this.userRepository.save(user);
  }
}
