import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserTest } from './user-test.entity';
import { Question } from './question.entity';

@Entity({ name: 'user_answers' })
export class UserAnswer extends BaseEntity {
  @ManyToOne(() => UserTest, (userTest) => userTest.userAnswers, {
    nullable: false,
  })
  @JoinColumn({ name: 'user_test_id' })
  userTest: UserTest;

  @ManyToOne(() => Question, { nullable: false })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ name: 'question_group_id', type: 'bigint', nullable: false })
  questionGroupId: number;

  @Column({ name: 'answer', type: 'char', length: 1, nullable: true })
  answer?: string;

  @Column({ name: 'is_correct', type: 'boolean', nullable: false })
  isCorrect: boolean;
}
