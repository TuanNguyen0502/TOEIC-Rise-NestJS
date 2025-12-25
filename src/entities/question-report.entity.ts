import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Question } from './question.entity';
import { User } from './user.entity';
import { EQuestionReportStatus } from '../enums/EQuestionReportStatus.enum';
import { EQuestionReportReason } from '../enums/EQuestionReportReason.enum';

@Entity('question_reports')
export class QuestionReport extends BaseEntity {
  @ManyToOne(() => Question, { nullable: false })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'resolver_id' })
  resolver: User;

  @Column({
    type: 'json', // Lưu mảng enum dưới dạng JSON array ["TYPO", "OTHER"]
    nullable: true,
  })
  reasons: EQuestionReportReason[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: EQuestionReportStatus,
    default: EQuestionReportStatus.PENDING,
  })
  status: EQuestionReportStatus;

  @Column({ name: 'resolved_note', type: 'text', nullable: true })
  resolvedNote: string;
}
