import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('chat_memories')
export class ChatMessage {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 36 })
  id: string;

  @Column({
    name: 'conversation_id',
    type: 'varchar',
    length: 36,
    nullable: false,
  })
  conversationId: string;

  @Column({ name: 'content', type: 'longtext', nullable: false })
  content: string;

  // Enum: USER, ASSISTANT, SYSTEM (để khớp với Spring AI)
  @Column({
    name: 'message_type',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  messageType: string;

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
