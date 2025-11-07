import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ETestSetStatus } from '../enums/ETestSetStatus.enum';

@Entity({ name: 'test_sets' })
export class TestSet extends BaseEntity {
  @Column({ type: 'varchar', nullable: false, unique: true })
  name: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ETestSetStatus,
    nullable: true, // Based on the Java @Column (it's not marked nullable=false)
  })
  status: ETestSetStatus;
}
