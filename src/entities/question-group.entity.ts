import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Test } from './test.entity';
import { Part } from './part.entity';
import { Question } from './question.entity';

@Entity({ name: 'question_groups' })
export class QuestionGroup extends BaseEntity {
  @Column({ name: 'audio_url', type: 'varchar', nullable: true })
  audioUrl?: string;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl?: string;

  @Column({ name: 'position', type: 'int', nullable: false })
  position: number;

  @Column({ name: 'passage', type: 'text', nullable: true })
  passage?: string;

  @Column({ name: 'transcript', type: 'text', nullable: true })
  transcript?: string;

  @ManyToOne(() => Test, { nullable: false })
  @JoinColumn({ name: 'test_id' })
  test: Test;

  @ManyToOne(() => Part, { nullable: false })
  @JoinColumn({ name: 'part_id' })
  part: Part;

  @OneToMany(() => Question, (question) => question.questionGroup)
  questions: Question[];
}
