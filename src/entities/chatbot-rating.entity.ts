import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { EChatbotRating } from '../enums/EChatbotRating.enum';

@Entity({ name: 'chatbot_ratings' })
export class ChatbotRating extends BaseEntity {
  @ManyToOne(() => User, { lazy: true, nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'message_id', type: 'varchar', nullable: true })
  messageId?: string;

  @Column({ name: 'conversation_title', type: 'varchar', nullable: false })
  conversationTitle: string;

  @Column({ name: 'message', type: 'text', nullable: false })
  message: string;

  @Column({
    name: 'rating',
    type: 'enum',
    enum: EChatbotRating,
    nullable: false,
  })
  rating: EChatbotRating;
}
