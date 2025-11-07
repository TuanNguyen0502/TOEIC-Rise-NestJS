import { Entity, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Account } from './account.entity';
import { Role } from './role.entity';
import { EGender } from '../enums/EGender.enum';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Column({ name: 'full_name', type: 'varchar', nullable: false })
  fullName: string;

  @Column({
    type: 'enum',
    enum: EGender,
    nullable: true,
  })
  gender?: EGender;

  @Column({ name: 'avatar', type: 'varchar', nullable: true })
  avatar?: string;

  @OneToOne(() => Account, { cascade: true })
  @JoinColumn({ name: 'account_id', referencedColumnName: 'id' })
  account: Account;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
  role: Role;
}
