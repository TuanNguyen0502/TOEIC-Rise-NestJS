import { Entity, Column, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { EAuthProvider } from '../enums/EAuthProvider.enum';

@Entity({ name: 'accounts' })
export class Account extends BaseEntity {
  @Column({ type: 'varchar', nullable: false, unique: true })
  email: string;

  @Column({ name: 'password', type: 'varchar', nullable: true })
  password?: string;

  @Column({
    name: 'auth_provider',
    type: 'enum',
    enum: EAuthProvider,
    nullable: false,
  })
  authProvider: EAuthProvider;

  @Column({
    name: 'is_active',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  isActive: boolean;

  @Column({ name: 'verification_code', type: 'varchar', nullable: true })
  verificationCode?: string;

  @Column({
    name: 'verification_code_expires_at',
    type: 'timestamp',
    nullable: true,
  })
  verificationCodeExpiresAt?: Date;

  @Column({
    name: 'failed_login_attempts',
    type: 'int',
    nullable: false,
    default: 0,
  })
  failedLoginAttempts: number;

  @Column({ name: 'account_locked_until', type: 'timestamp', nullable: true })
  accountLockedUntil?: Date;

  @Column({
    name: 'resend_verification_attempts',
    type: 'int',
    nullable: false,
    default: 0,
  })
  resendVerificationAttempts: number;

  @Column({
    name: 'resend_verification_locked_until',
    type: 'timestamp',
    nullable: true,
  })
  resendVerificationLockedUntil?: Date;

  @Column({ name: 'refresh_token', type: 'varchar', nullable: true })
  refreshToken?: string;

  @Column({
    name: 'refresh_token_expiry_date',
    type: 'timestamp',
    nullable: true,
  })
  refreshTokenExpiryDate?: Date;

  @OneToOne(() => User, (user) => user.account)
  user: User;

  isAccountNonLocked(): boolean {
    if (!this.accountLockedUntil) {
      return true;
    }
    return new Date() >= new Date(this.accountLockedUntil);
  }
}
