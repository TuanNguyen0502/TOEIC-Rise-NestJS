import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Test } from './test.entity';
import { UserAnswer } from './user-answer.entity';

@Entity({ name: 'user_tests' })
export class UserTest extends BaseEntity {
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Test, { nullable: false })
  @JoinColumn({ name: 'test_id' })
  test: Test;

  @Column({ name: 'total_questions', type: 'int', nullable: true })
  totalQuestions?: number;

  @Column({ name: 'correct_answers', type: 'int', nullable: true })
  correctAnswers?: number;

  @Column({ name: 'correct_percent', type: 'double', nullable: true })
  correctPercent?: number;

  @Column({ name: 'time_spent', type: 'int', nullable: true })
  timeSpent?: number; // in seconds

  @Column({ type: 'json', nullable: true })
  parts?: string[]; // Storing List<String>

  @Column({ name: 'total_score', type: 'int', nullable: true })
  totalScore?: number;

  @Column({ name: 'listening_score', type: 'int', nullable: true })
  listeningScore?: number;

  @Column({ name: 'reading_score', type: 'int', nullable: true })
  readingScore?: number;

  @Column({
    name: 'listening_correct_answers',
    type: 'int',
    nullable: true,
  })
  listeningCorrectAnswers?: number;

  @Column({ name: 'reading_correct_answers', type: 'int', nullable: true })
  readingCorrectAnswers?: number;

  @Column({ name: 'total_listening_questions', type: 'int', nullable: true })
  totalListeningQuestions?: number;

  @Column({ name: 'total_reading_questions', type: 'int', nullable: true })
  totalReadingQuestions?: number;

  @OneToMany(() => UserAnswer, (userAnswer) => userAnswer.userTest, {
    cascade: true,
  })
  userAnswers: UserAnswer[];
}
