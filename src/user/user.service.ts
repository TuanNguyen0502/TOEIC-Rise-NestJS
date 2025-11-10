import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from 'src/entities/account.entity';
import { User } from 'src/entities/user.entity';
import { Role } from 'src/entities/role.entity';
import { EGender } from 'src/enums/EGender.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
  ): Promise<User> {
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
    return newUser;
  }
}
