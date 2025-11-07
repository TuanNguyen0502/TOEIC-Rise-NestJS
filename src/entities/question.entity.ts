import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { StringListTransformer } from 'src/common/utils/string-list.transformer';
import { BaseEntity } from './base.entity';
import { QuestionGroup } from './question-group.entity';
import { Tag } from './tag.entity';

@Entity({ name: 'questions' })
export class Question extends BaseEntity {
  @Column({ type: 'int', nullable: false })
  position: number;

  @Column({ type: 'text', nullable: false })
  content: string;

  // Storing List<String> as JSON. Requires 'json' type support in DB.
  @Column({
    type: 'json',
    nullable: true,
    transformer: new StringListTransformer(),
  })
  options: string[];

  @Column({ name: 'correct_option', type: 'char', length: 1, nullable: false })
  correctOption: string;

  @Column({ name: 'explanations', type: 'text', nullable: true })
  explanation?: string;

  @ManyToOne(() => QuestionGroup, { nullable: false })
  @JoinColumn({ name: 'question_group_id' })
  questionGroup: QuestionGroup;

  @ManyToMany(() => Tag, (tag) => tag.questions)
  @JoinTable({
    name: 'questions_tags',
    joinColumn: { name: 'question_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];
}
