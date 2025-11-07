import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TestSet } from './test-set.entity';
import { ETestStatus } from '../enums/ETestStatus.enum';

@Entity({ name: 'tests' })
export class Test extends BaseEntity {
  @Column({ type: 'varchar', nullable: false, unique: true })
  name: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ETestStatus,
    nullable: false,
  })
  status: ETestStatus;

  @Column({ name: 'number_of_learner_tests', type: 'bigint', nullable: true })
  numberOfLearnerTests: number;

  @ManyToOne(() => TestSet)
  @JoinColumn({ name: 'test_set_id' })
  testSet: TestSet;
}
