import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Flashcard } from './flashcard.entity';

@Entity({ name: 'flashcard_items' })
export class FlashcardItem {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    nullable: true,
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    nullable: true,
  })
  updatedAt: Date;
  @ManyToOne(() => Flashcard, (flashcard) => flashcard.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'flashcard_id' })
  flashcard: Flashcard;

  @Column({ type: 'varchar', length: 255, nullable: false })
  vocabulary: string;

  @Column({ type: 'text', nullable: false })
  definition: string;

  @Column({ name: 'audio_url', type: 'varchar', length: 512, nullable: true })
  audioUrl?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pronunciation?: string;
}

