import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionService } from './question.service';
import { AdminQuestionController } from './admin-question.controller';
import { Question } from '../entities/question.entity';
import { QuestionGroup } from '../entities/question-group.entity';
import { Tag } from '../entities/tag.entity';
import { AuthModule } from 'src/auth/auth.module';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { QuestionController } from './question.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, QuestionGroup, Tag]),
    AuthModule, // Import AuthModule to use JwtAuthGuard
  ],
  controllers: [AdminQuestionController, QuestionController],
  providers: [QuestionService, RolesGuard], // Provide RolesGuard
})
export class QuestionModule {}
