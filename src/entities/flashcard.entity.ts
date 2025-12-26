import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { FlashcardItem } from './flashcard-item.entity';
import { FlashcardFavourite } from './flashcard-favourite.entity';
import { EAccessType } from '../enums/EAccessType.enum';

@Entity({ name: 'flashcards' })
export class Flashcard {
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

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    name: 'access_type',
    type: 'enum',
    enum: EAccessType,
    nullable: false,
    default: EAccessType.PRIVATE,
  })
  accessType: EAccessType;

  @Column({
    name: 'favourite_count',
    type: 'int',
    nullable: false,
    default: 0,
  })
  favouriteCount: number;

  @OneToMany(() => FlashcardItem, (item) => item.flashcard, {
    cascade: true,
  })
  items: FlashcardItem[];

  @OneToMany(() => FlashcardFavourite, (favourite) => favourite.flashcard, {
    cascade: true,
  })
  favourites: FlashcardFavourite[];
}

