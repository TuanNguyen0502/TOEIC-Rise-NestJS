import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Flashcard } from 'src/entities/flashcard.entity';
import { FlashcardService } from './flashcard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Flashcard])],
  providers: [FlashcardService],
  exports: [FlashcardService],
})
export class FlashcardModule {}
