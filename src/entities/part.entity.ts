import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'parts' })
export class Part extends BaseEntity {
  @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
  name: string;
}
