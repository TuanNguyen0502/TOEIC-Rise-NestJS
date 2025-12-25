import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionService } from './question.service';
import { AdminQuestionController } from './admin-question.controller';
import { Question } from '../entities/question.entity';
import { QuestionGroup } from '../entities/question-group.entity';
import { Tag } from '../entities/tag.entity';
import { AuthModule } from 'src/auth/auth.module';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { QuestionGroupModule } from 'src/question-group/question-group.module';
import { TestSetModule } from 'src/test-set/test-set.module';
import { TestSet } from 'src/entities/test-set.entity';
import { TagModule } from 'src/tag/tag.module';
import { QuestionMapper } from './mapper/question.mapper';
import { Test } from 'src/entities/test.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, QuestionGroup, Tag, TestSet, Test]),
    AuthModule, // Import AuthModule to use JwtAuthGuard
    QuestionGroupModule,
    TestSetModule,
    TagModule,
    QuestionModule,
  ],
  controllers: [AdminQuestionController],
  providers: [QuestionService, RolesGuard, QuestionMapper], // Provide RolesGuard
  exports: [QuestionService, QuestionMapper],
})
export class QuestionModule {}
