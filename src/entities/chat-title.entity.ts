import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  PrimaryColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'chat_titles' })
export class ChatTitle {
  @PrimaryColumn({ type: 'varchar' }) // Based on your Java @Id (String)
  id: string;

  @ManyToOne(() => User, { lazy: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'conversation_id', type: 'varchar', nullable: false })
  conversationId: string;

  @Column({ name: 'title', type: 'varchar', nullable: false })
  title: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: false })
  updatedAt: Date;
}
