import {
  Injectable,
  UnauthorizedException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyUserDto } from './dto/verify-user.dto';
import { Account } from 'src/entities/account.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { MailerService } from '@nestjs-modules/mailer';
import { generateVerificationCode } from 'src/common/utils/code-generator.util';
import { EAuthProvider } from 'src/enums/EAuthProvider.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/entities/role.entity';
import { Repository } from 'typeorm';
import { ERole } from 'src/enums/ERole.enum';
import { ErrorCode } from 'src/enums/ErrorCode.enum';
import { AppException } from 'src/exceptions/app.exception';

const CACHE_REGISTRATION = 'cacheRegistration';
const CACHE_FULLNAME_REGISTRATION = 'cacheRegistrationFullName';
const CACHE_REGISTRATION_TTL = 12 * 60 * 60 * 1000; // 12 hours

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async login(loginDto: LoginDto) {
    const account = await this.validateUser(loginDto.email, loginDto.password);
    if (!account) {
      throw new AppException(ErrorCode.INVALID_CREDENTIALS);
    }

    const user = (account as Account).user;

    const payload = {
      email: account.email,
      sub: user.id, // 'sub' (subject) thường dùng để lưu ID
      roles: [user.role.name], // Gắn roles vào token
    };

    return {
      accessToken: this.jwtService.sign(payload),
      expirationTime: process.env.JWT_EXPIRATION_TIME,
      userId: user.id,
      email: account.email,
      fullName: user.fullName,
      role: user.role.name,
    };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const account = await this.userService.findOneByEmail(email);

    if (!account || !account.password) {
      throw new AppException(ErrorCode.INVALID_CREDENTIALS);
    }

    if (!account.isAccountNonLocked()) {
      throw new AppException(ErrorCode.ACCOUNT_LOCKED);
    }

    const isMatch = await bcrypt.compare(pass, account.password);

    if (isMatch) {
      if (!account.isActive) {
        throw new AppException(ErrorCode.UNVERIFIED_ACCOUNT);
      }

      if (account.failedLoginAttempts > 0) {
        account.failedLoginAttempts = 0;
        account.accountLockedUntil = undefined;
        await this.userService.saveAccount(account);
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = account;
      return result;
    } else {
      account.failedLoginAttempts = (account.failedLoginAttempts || 0) + 1;
      if (account.failedLoginAttempts >= 5) {
        const lockTime = new Date();
        lockTime.setMinutes(lockTime.getMinutes() + 30);
        account.accountLockedUntil = lockTime;
      }
      await this.userService.saveAccount(account);

      throw new AppException(ErrorCode.INVALID_CREDENTIALS);
    }
  }

  async register(registerDto: RegisterDto): Promise<string> {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new AppException(ErrorCode.PASSWORD_MISMATCH);
    }

    const existingAccount = await this.userService.findOneByEmail(
      registerDto.email,
    );
    if (existingAccount) {
      throw new AppException(ErrorCode.DUPLICATE_EMAIL);
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const tempAccountData = {
      email: registerDto.email,
      password: hashedPassword,
      verificationCode: verificationCode,
      verificationCodeExpiresAt: expiresAt,
      isActive: false,
      authProvider: EAuthProvider.LOCAL,
    };

    const cacheKey = `${CACHE_REGISTRATION}::${registerDto.email}`;
    const fullNameCacheKey = `${CACHE_FULLNAME_REGISTRATION}::${registerDto.email}`;

    await this.cacheManager.set(
      cacheKey,
      tempAccountData,
      CACHE_REGISTRATION_TTL,
    );
    await this.cacheManager.set(
      fullNameCacheKey,
      registerDto.fullName,
      CACHE_REGISTRATION_TTL,
    );

    await this.sendVerificationEmail(registerDto.email, verificationCode);

    return 'Registration successful. Please check your email for the verification code.';
  }

  async verifyUser(verifyDto: VerifyUserDto): Promise<string> {
    const cacheKey = `${CACHE_REGISTRATION}::${verifyDto.email}`;
    const fullNameCacheKey = `${CACHE_FULLNAME_REGISTRATION}::${verifyDto.email}`;

    const tempAccountData: any = await this.cacheManager.get(cacheKey);
    const fullName: string | undefined =
      await this.cacheManager.get(fullNameCacheKey);

    if (!tempAccountData || !fullName) {
      throw new AppException(ErrorCode.REGISTRATION_EXPIRED);
    }

    if (new Date(tempAccountData.verificationCodeExpiresAt) < new Date()) {
      throw new AppException(ErrorCode.OTP_EXPIRED);
    }

    if (tempAccountData.verificationCode !== verifyDto.verificationCode) {
      throw new AppException(ErrorCode.INVALID_OTP, "Register's");
    }

    const learnerRole = await this.roleRepository.findOne({
      where: { name: ERole.LEARNER },
    });
    if (!learnerRole) {
      throw new NotFoundException(
        'LEARNER role not found. Please seed database.',
      );
    }

    const accountDataToSave: Partial<Account> = {
      email: tempAccountData.email,
      password: tempAccountData.password,
      authProvider: tempAccountData.authProvider,
      isActive: true,
      verificationCode: undefined,
      verificationCodeExpiresAt: undefined,
    };

    await this.userService.createAccountAndUser(
      accountDataToSave,
      fullName,
      learnerRole,
    );

    await this.cacheManager.del(cacheKey);
    await this.cacheManager.del(fullNameCacheKey);

    return 'Account verified successfully';
  }

  private async sendVerificationEmail(email: string, verificationCode: string) {
    const subject = 'Account Verification';
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: subject,
        template: 'emailTemplate',
        context: {
          subject: subject,
          verificationCode: verificationCode,
        },
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new AppException(ErrorCode.MAIL_SEND_FAILED);
    }
  }
}
