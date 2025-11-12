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
}
