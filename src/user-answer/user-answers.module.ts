import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAnswer } from 'src/entities/user-answer.entity';
import { UserAnswersController } from './user-answers.controller';
import { UserAnswersService } from './user-answers.service';
import { UserAnswerMapper } from './mapper/user-answer.mapper';
import { QuestionGroupModule } from 'src/question-group/question-group.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserAnswer]), QuestionGroupModule],
  controllers: [UserAnswersController],
  providers: [UserAnswersService, UserAnswerMapper],
})
export class UserAnswersModule {}
