import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { ERole } from '../enums/ERole.enum';

@Entity({ name: 'roles' })
export class Role extends BaseEntity {
  @Column({
    type: 'enum',
    enum: ERole,
    nullable: false,
    unique: true,
  })
  name: ERole;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
