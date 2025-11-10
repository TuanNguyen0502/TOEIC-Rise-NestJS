import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import type { Cache } from 'cache-manager';
import { UserService } from 'src/user/user.service';
import { Account } from 'src/entities/account.entity';
import { Role } from 'src/entities/role.entity';
import { generateVerificationCode } from 'src/common/utils/code-generator.util';
import { EAuthProvider } from 'src/enums/EAuthProvider.enum';
import { ERole } from 'src/enums/ERole.enum';
import { ErrorCode } from 'src/enums/ErrorCode.enum';
import { AppException } from 'src/exceptions/app.exception';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyUserDto } from './dto/verify-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const account = await this.validateUser(loginDto.email, loginDto.password);
    if (!account) {
      throw new AppException(ErrorCode.INVALID_CREDENTIALS);
    }

    const user = (account as Account).user;

    const payload = {
      email: account.email,
      sub: user.id,
      roles: [user.role.name],
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
      resendVerificationAttempts: 0,
      resendVerificationLockedUntil: undefined,
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

  async resendVerificationCode(email: string): Promise<string> {
    const cacheKey = `${CACHE_REGISTRATION}::${email}`;
    let isRegistering = false; // Flag to determine whether to save to cache or DB
    let accountData: any; // Will hold data from DB or cache

    // 1. Check DB first for existing account
    const accountInDb = await this.userService.findOneByEmail(email);

    if (accountInDb) {
      if (accountInDb.isActive) {
        throw new AppException(ErrorCode.VERIFIED_ACCOUNT);
      }
      accountData = accountInDb; // Use data from DB
      isRegistering = false;
    } else {
      // 2. If not in DB, check cache
      accountData = await this.cacheManager.get(cacheKey);
      if (!accountData) {
        // Not in DB and not in cache
        throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Account');
      }
      isRegistering = true; // Data is in cache
    }

    // 3. Check resend lock logic
    if (
      accountData.resendVerificationLockedUntil &&
      new Date(accountData.resendVerificationLockedUntil) > new Date()
    ) {
      throw new AppException(ErrorCode.OTP_LIMIT_EXCEEDED, '5');
    }

    // 4. Increase the number of attempts
    const attempts = (accountData.resendVerificationAttempts || 0) + 1;
    accountData.resendVerificationAttempts = attempts;

    // 5. Check lock condition
    if (attempts >= 5) {
      const lockTime = new Date();
      lockTime.setMinutes(lockTime.getMinutes() + 30);
      accountData.resendVerificationLockedUntil = lockTime;
      accountData.resendVerificationAttempts = 0; // Reset counter

      await this.saveTempAccount(isRegistering, email, accountData);
      throw new AppException(ErrorCode.OTP_LIMIT_EXCEEDED, '5');
    }

    // 6. Generate new code and send email
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    accountData.verificationCode = verificationCode;
    accountData.verificationCodeExpiresAt = expiresAt;

    await this.sendVerificationEmail(email, verificationCode);

    // 7. Save data (to cache or DB)
    await this.saveTempAccount(isRegistering, email, accountData);

    return 'Verification code sent';
  }

  private async saveTempAccount(
    isRegistering: boolean,
    email: string,
    data: any,
  ) {
    if (isRegistering) {
      // Data is a JSON object, save to cache
      const cacheKey = `${CACHE_REGISTRATION}::${email}`;
      await this.cacheManager.set(cacheKey, data, CACHE_REGISTRATION_TTL);
    } else {
      // Data is an Account entity, save to DB
      await this.userService.saveAccount(data as Account);
    }
  }

  private async sendVerificationEmail(email: string, verificationCode: string) {
    const subject = 'Account Verification';
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: subject,
        template: 'emailTemplate', // Name of the .hbs file
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

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<string> {
    const { email } = forgotPasswordDto;
    const account = await this.userService.findOneByEmail(email);

    if (!account) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Account');
    }

    // Logic rate-limiting
    if (
      account.resendVerificationLockedUntil &&
      new Date(account.resendVerificationLockedUntil) > new Date()
    ) {
      throw new AppException(ErrorCode.OTP_LIMIT_EXCEEDED, '5');
    }

    const attempts = (account.resendVerificationAttempts || 0) + 1;
    account.resendVerificationAttempts = attempts;

    if (attempts >= 5) {
      const lockTime = new Date();
      lockTime.setMinutes(lockTime.getMinutes() + 30);
      account.resendVerificationLockedUntil = lockTime;
      account.resendVerificationAttempts = 0;
      await this.userService.saveAccount(account);
      throw new AppException(ErrorCode.OTP_LIMIT_EXCEEDED, '5');
    }

    // Generate OTP and send email
    const verificationCode = generateVerificationCode();
    account.verificationCode = verificationCode;
    account.verificationCodeExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.userService.saveAccount(account);
    await this.sendVerificationEmail(email, verificationCode);

    return 'Verification code sent';
  }

  async verifyOtp(verifyDto: VerifyOtpDto): Promise<{ resetToken: string }> {
    const { email, otp } = verifyDto;
    const account = await this.userService.findOneByEmail(email);

    if (!account) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Account');
    }

    if (!account.verificationCode || account.verificationCode !== otp) {
      throw new AppException(ErrorCode.INVALID_OTP, "User's");
    }

    if (
      !account.verificationCodeExpiresAt ||
      new Date(account.verificationCodeExpiresAt) < new Date()
    ) {
      throw new AppException(ErrorCode.OTP_EXPIRED);
    }

    // Clear OTP after verification
    account.verificationCode = undefined;
    account.verificationCodeExpiresAt = undefined;
    await this.userService.saveAccount(account);

    // Generate special token for password reset
    const resetToken = await this._generatePasswordResetToken(account);
    return { resetToken };
  }

  async resetPassword(
    resetDto: ResetPasswordDto,
    token: string,
  ): Promise<string> {
    if (resetDto.password !== resetDto.confirmPassword) {
      throw new AppException(ErrorCode.PASSWORD_MISMATCH);
    }

    let payload: any;
    try {
      // Verify token
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET_KEY'),
      });
    } catch (error) {
      throw new AppException(ErrorCode.TOKEN_EXPIRED);
    }

    // Check if this is a password reset token
    if (!payload.resetPwd) {
      throw new AppException(ErrorCode.TOKEN_INVALID);
    }

    const account = await this.userService.findOneByEmail(payload.email);
    if (!account) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Account');
    }

    // Update new password
    account.password = await bcrypt.hash(resetDto.password, 10);
    await this.userService.saveAccount(account);

    return 'Password reset successfully';
  }

  private async _generatePasswordResetToken(account: Account): Promise<string> {
    const payload = {
      email: account.email,
      sub: account.user.id,
      resetPwd: true, // Special claim
    };
    return this.jwtService.sign(payload, {
      expiresIn: '15m', // Token valid for 15 minutes
    });
  }
}
