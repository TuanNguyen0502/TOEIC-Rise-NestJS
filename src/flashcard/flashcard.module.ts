import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Flashcard } from 'src/entities/flashcard.entity';
import { User } from 'src/entities/user.entity';
import { FlashcardFavourite } from 'src/entities/flashcard-favourite.entity';
import { FlashcardService } from './flashcard.service';
import { FlashcardController } from './flashcard.controller';
import { FlashcardMapper } from './mapper/flashcard.mapper';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Flashcard, User, FlashcardFavourite]),
    AuthModule,
  ],
  providers: [FlashcardService, FlashcardMapper],
  controllers: [FlashcardController],
  exports: [FlashcardService],
})
export class FlashcardModule {}
