import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Flashcard } from './flashcard.entity';

@Entity({ name: 'flashcard_favourites' })
@Unique(['user', 'flashcard'])
export class FlashcardFavourite {
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
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Flashcard, (flashcard) => flashcard.favourites, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'flashcard_id' })
  flashcard: Flashcard;
}

