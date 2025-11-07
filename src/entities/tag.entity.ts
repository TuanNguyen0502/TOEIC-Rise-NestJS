import { Entity, Column, ManyToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Question } from './question.entity';

@Entity({ name: 'tags' })
export class Tag extends BaseEntity {
  @Column({ type: 'varchar', nullable: false, unique: true })
  name: string;

  @ManyToMany(() => Question, (question) => question.tags)
  questions: Question[];
}
