import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Flashcard } from 'src/entities/flashcard.entity';
import { User } from 'src/entities/user.entity';
import { FlashcardService } from './flashcard.service';
import { FlashcardController } from './flashcard.controller';
import { FlashcardMapper } from './mapper/flashcard.mapper';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Flashcard, User]),
    AuthModule,
  ],
  providers: [FlashcardService, FlashcardMapper],
  controllers: [FlashcardController],
  exports: [FlashcardService],
})
export class FlashcardModule {}
