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
import { ERole } from 'src/enums/ERole.enum';
import { UserUpdateRequestDto } from './dto/user-update-request.dto';
import { UserResetPasswordDto } from './dto/user-reset-password.dto';
type CountUserTestByAuthen = {
  email: string; // raw query luôn trả về string
  google: string;
};
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
      role: user.role?.name || null,
      updatedAt: user.updatedAt ? this.formatDate(user.updatedAt) : '',
    };
  }

  // Hàm helper format ngày yyyy-MM-dd HH:mm:ss giống Java
  private formatDate(date: Date): string {
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
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

  async changeAccountStatus(userId: number): Promise<void> {
    // 1. Tìm User kèm Account và Role
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['account', 'role'],
    });

    if (!user) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        `User with id ${userId} not found`,
      );
    }

    // 2. Validate: Không được khóa tài khoản ADMIN
    if (user.role.name === ERole.ADMIN) {
      throw new AppException(
        ErrorCode.INVALID_REQUEST,
        'Cannot change status of ADMIN',
      );
    }

    // 3. Đảo ngược trạng thái isActive của Account
    if (user.account) {
      user.account.isActive = !user.account.isActive;
      // Lưu thay đổi vào bảng Account
      await this.accountRepository.save(user.account);
    }
  }

  async updateUser(
    id: number,
    dto: UserUpdateRequestDto,
    avatarFile?: Express.Multer.File,
  ): Promise<void> {
    // 1. Tìm User cần sửa
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['account', 'role'],
    });

    if (!user) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        `User with id ${id} not found`,
      );
    }
    // 3. Xử lý Role
    if (dto.role) {
      const role = await this.roleRepository.findOne({
        where: { name: dto.role },
      });
      if (!role) {
        throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Role not found');
      }
      user.role = role;
    }

    // 4. Xử lý Avatar (nếu có upload file mới)
    if (avatarFile) {
      this.cloudinary.validateImageFile(avatarFile);
      // Nếu user đã có avatar cũ, logic updateFile sẽ tự xóa cũ -> up mới
      const newAvatarUrl = await this.cloudinary.updateFile(
        avatarFile,
        user.avatar || '',
      );
      user.avatar = newAvatarUrl;
    }

    // 5. Cập nhật các thông tin cơ bản khác
    if (dto.fullName) user.fullName = dto.fullName;
    if (dto.gender) user.gender = dto.gender;
    if (dto.isActive !== undefined) {
      user.account.isActive = dto.isActive;
    }
    user.updatedAt = new Date();

    await this.userRepository.save(user);
  }

  async resetPassword(
    userId: number,
    dto: UserResetPasswordDto,
  ): Promise<void> {
    // 1. Kiểm tra Confirm Password
    if (dto.password !== dto.confirmPassword) {
      throw new AppException(ErrorCode.PASSWORD_MISMATCH);
    }

    // 2. Tìm User kèm Account
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['account'], // Quan trọng: Load relation Account để update password
    });

    if (!user) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'User');
    }

    if (!user.account) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        'User account not found',
      );
    }

    // 3. Hash password mới (Dùng bcrypt)
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // 4. Cập nhật và lưu vào bảng Account
    await this.accountRepository.update(user.account.id, {
      password: hashedPassword,
    });
  }

  async countAllUsers(): Promise<number> {
    return this.accountRepository.count();
  }

  async countUsersByRole(role: ERole): Promise<number> {
    return this.userRepository.count({
      where: { role: { name: role } },
    });
  }

  async countUsersByRoleBetweenDays(
    role: ERole,
    from: Date,
    to: Date,
  ): Promise<number> {
    return this.userRepository
      .createQueryBuilder('u')
      .innerJoin('u.role', 'r')
      .where('r.name = :role', { role })
      .andWhere('u.createdAt >= :from', { from })
      .andWhere('u.createdAt < :to', { to })
      .getCount();
  }

  async countActiveUsersByRoleBetweenDays(
    role: ERole,
    from: Date,
    to: Date,
  ): Promise<number> {
    return this.accountRepository
      .createQueryBuilder('a')
      .innerJoin('a.user', 'u')
      .innerJoin('u.role', 'r')
      .where('r.name = :role', { role })
      .andWhere('a.updatedAt >= :from', { from })
      .andWhere('a.updatedAt < :to', { to })
      .getCount();
  }

  async countSourceInsight(
    start: Date,
    end: Date,
    role: ERole,
  ): Promise<{ email: number; google: number }> {
    const result = await this.accountRepository
      .createQueryBuilder('a')
      .innerJoin('a.user', 'u')
      .innerJoin('u.role', 'r')
      .select([
        'COALESCE(SUM(CASE WHEN a.authProvider = :local THEN 1 ELSE 0 END), 0) AS email',
        'COALESCE(SUM(CASE WHEN a.authProvider = :google THEN 1 ELSE 0 END), 0) AS google',
      ])
      .where('r.name = :role', { role })
      .andWhere('a.createdAt >= :start', { start })
      .andWhere('a.createdAt < :end', { end })
      .setParameter('local', EAuthProvider.LOCAL)
      .setParameter('google', EAuthProvider.GOOGLE)
      .getRawOne<CountUserTestByAuthen>();

    return {
      email: parseInt(result?.email || '0', 10),
      google: parseInt(result?.google || '0', 10),
    };
  }
}
